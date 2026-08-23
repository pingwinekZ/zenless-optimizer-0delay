import {
  cmpEq,
  cmpGE,
  compile,
  constant,
  custom,
  max,
  min,
  type NumTagFree,
  prod,
  read,
  subscript,
  sum,
  sumfrac,
} from '@zenless-optimizer/pando/engine'
import {
  compileWgsl,
  f32Literal,
  generateConstraintFilter,
  generateIndexDecode,
  generateObjectiveFilter,
  type WgslCompileResult,
} from './codegen/compileWgsl'
import { decodeChunk, dispatchStartIndices } from './codegen/mixedRadix'
import {
  computeBudgetedChunkSize,
  computeChunkSize,
  dispatchWorkgroups,
  generateWgsl,
  MAX_CHUNK,
  MAX_CHUNK_MS,
  MIN_CHUNK,
  TARGET_CHUNKS,
} from './webgpuInternals'
import { packF16, sanitizeTuning } from './webgpuOptimizer'

/**
 * Translate a `compileWgsl` result into a JS function with the same semantics,
 * so the generated expressions can be executed in-process. Mirrors the shader
 * environment: `coords` (candidate matrix), `idxN` (per-slot indices), `fN`
 * (slot base offsets), `q` (coordinate count). Folded nodes evaluate to their
 * compile-time constant.
 */
function evaluateWgsl(
  generated: WgslCompileResult,
  coords: Float32Array,
  idx: number[],
  sizes: number[],
  q: number,
  nodes: NumTagFree[],
  f16 = false
): number[] {
  // f16 mode wraps storage loads in `f32(coords[...])`; strip the cast so the
  // JS evaluator sees a plain array read (the coords are already quantized
  // through packF16 by the caller, mirroring the GPU's f16->f32 loads).
  const stripF16 = (code: string) =>
    f16 ? code.replace(/f32\((coords\[[^\]]*\])\)/g, '$1') : code
  const jsPrelude = stripF16(
    generated.prelude
      .replace(/array<f32, \d+>\(([^)]*)\)/g, '[$1]')
      .replace(/:\s*array<f32, \d+>/g, '')
      .trim()
  )
  const jsReadBase = stripF16(
    generated.readBaseInit
      .replace(/var (base_\d+): f32 = /g, 'let $1 = ')
      .trim()
  )
  let cumulative = 0
  const fN = idx
    .map((_, s) => {
      const f = cumulative
      cumulative += sizes[s]
      return `const f${s} = ${f};`
    })
    .join('\n')
  const idxN = idx.map((_, s) => `const idx${s} = ${idx[s]};`).join('\n')
  const rows = sizes.reduce((n, s) => n + s, 0)
  const results = nodes.map((node) => {
    const cv = generated.folded.get(node)
    return cv !== undefined ? f32Literal(cv) : generated.names.get(node)!
  })
  const body = `
const min = Math.min, max = Math.max;
const select = (f, t, c) => (c ? t : f);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const u32 = (v) => Math.floor(v);
const floor = Math.floor;
${fN}
${idxN}
${jsPrelude}
${jsReadBase}
${stripF16(generated.evalConstraints)}
${stripF16(generated.evalObjective)}
return [${results.join(', ')}];
`
  const fn = new Function('coords', 'q', 'rows', body) as (
    coords: Float32Array,
    q: number,
    rows: number
  ) => number[]
  return fn(coords, q, rows)
}

describe('f32Literal', () => {
  test('formats floats for WGSL', () => {
    expect(f32Literal(5)).toBe('5.0')
    expect(f32Literal(-2)).toBe('-2.0')
    expect(f32Literal(0.8922)).toBe('0.8922')
    expect(f32Literal(1e-7)).toBe('1.0e-7')
    expect(f32Literal(1.5)).toBe('1.5')
    expect(f32Literal(Infinity)).toBe('3.4028234663852886e+38')
    expect(f32Literal(-Infinity)).toBe('-3.4028234663852886e+38')
    expect(f32Literal(NaN)).toBe('0.0')
  })
})

describe('compileWgsl', () => {
  const coordKeys = ['atk_', 'crit_p', 'dmg_', 'subs_']
  const opts = { dynTagCat: 'q', slotCount: 2, coordKeys }

  test('reads sum over slots', () => {
    const nodes = [read({ q: 'atk_' })]
    const generated = compileWgsl(nodes, opts)
    const name = generated.names.get(nodes[0])
    // Slowly-varying slots (1..N-1) are hoisted into a per-coordinate base
    // refreshed only when slot 0 wraps; the per-cycle read is base + slot 0.
    expect(generated.readBaseInit).toContain(
      'var base_0: f32 = coords[0 * rows + (f1 + idx1)];'
    )
    expect(generated.readBaseUpdate).toContain(
      'base_0 = coords[0 * rows + (f1 + idx1)];'
    )
    expect(generated.evalObjective).toContain(
      `${name} = (base_0 + coords[0 * rows + (f0 + idx0)]);`
    )
  })

  test('f16 mode casts every coordinate load to f32', () => {
    const nodes = [read({ q: 'atk_' })]
    const f16Generated = compileWgsl(nodes, { ...opts, f16: true })
    expect(f16Generated.readBaseInit).toContain(
      'var base_0: f32 = f32(coords[0 * rows + (f1 + idx1)]);'
    )
    expect(f16Generated.readBaseUpdate).toContain(
      'base_0 = f32(coords[0 * rows + (f1 + idx1)]);'
    )
    expect(f16Generated.evalObjective).toContain(
      `${f16Generated.names.get(nodes[0])} = (base_0 + f32(coords[0 * rows + (f0 + idx0)]));`
    )
    // single-slot reads cast too
    const single = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 1,
      coordKeys: ['atk_'],
      f16: true,
    })
    expect(single.evalObjective).toContain(
      `${single.names.get(nodes[0])} = (f32(coords[0 * rows + (f0 + idx0)]));`
    )
    // default (no f16) stays cast-free
    const f32Generated = compileWgsl(nodes, opts)
    expect(f32Generated.evalObjective).toContain(
      `${f32Generated.names.get(nodes[0])} = (base_0 + coords[0 * rows + (f0 + idx0)]);`
    )
  })

  test('reads only sum over slots that carry the coordinate', () => {
    // slot 0 carries only a_, slot 1 only b_: a_ keeps a direct per-cycle
    // load (no base), b_ becomes a pure hoisted-base read (no per-cycle load)
    const nodes = [sum(read({ q: 'a_' }), read({ q: 'b_' }))]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_', 'b_'],
      slotCoordKeys: [['a_'], ['b_']],
    })
    const a = generated.names.get((nodes[0] as any).x[0])
    const b = generated.names.get((nodes[0] as any).x[1])
    expect(generated.readBaseInit).toContain(
      'var base_1: f32 = coords[1 * rows + (f1 + idx1)];'
    )
    expect(generated.readBaseInit).not.toContain('base_0')
    expect(generated.evalObjective).toContain(
      `${a} = (coords[0 * rows + (f0 + idx0)]);`
    )
    expect(generated.evalObjective).toContain(`${b} = (base_1);`)
  })

  test('shared coordinates keep both the base and the slot-0 load', () => {
    const nodes = [read({ q: 'a_' })]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_'],
      slotCoordKeys: [['a_'], ['a_']],
    })
    expect(generated.readBaseInit).toContain(
      'var base_0: f32 = coords[0 * rows + (f1 + idx1)];'
    )
    expect(generated.evalObjective).toContain(
      `${generated.names.get(nodes[0])} = (base_0 + coords[0 * rows + (f0 + idx0)]);`
    )
  })

  test('single-slot reads skip the hoisted base', () => {
    const nodes = [read({ q: 'atk_' })]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 1,
      coordKeys: ['atk_'],
    })
    expect(generated.readBaseInit).toBe('')
    expect(generated.readBaseUpdate).toBe('')
    expect(generated.evalObjective).toContain(
      `${generated.names.get(nodes[0])} = (coords[0 * rows + (f0 + idx0)]);`
    )
  })

  test('unknown read tags fold to zero and drop from the eval', () => {
    const nodes = [read({ q: 'missing' })]
    const generated = compileWgsl(nodes, opts)
    expect(generated.folded.get(nodes[0])).toBe(0)
    expect(generated.evalObjective).toBe('')
    expect(generated.liveCoordKeys).toEqual([])
  })

  test('arithmetic ops inline folded constants', () => {
    const nodes = [
      sum(read({ q: 'atk_' }), constant(2)),
      prod(read({ q: 'atk_' }), constant(3)),
      sumfrac(read({ q: 'atk_' }), constant(6)),
      min(read({ q: 'atk_' }), constant(7), constant(8)),
      max(constant(1), read({ q: 'dmg_' })),
    ]
    const generated = compileWgsl(nodes, opts)
    // nodes[1..] are constraint roots, so their statements live in the
    // constraint section (nodes[0] alone is the objective)
    const evalCode = generated.evalConstraints + '\n' + generated.evalObjective
    const n = (i: number) => generated.names.get(nodes[i])
    const child = (node: any, i: number) => generated.names.get(node.x[i])
    expect(evalCode).toContain(`${n(0)} = (2.0 + ${child(nodes[0], 0)});`)
    expect(evalCode).toContain(`${n(1)} = (3.0 * ${child(nodes[1], 0)});`)
    expect(evalCode).toContain(
      `${n(2)} = (${child(nodes[2], 0)} / (${child(nodes[2], 0)} + 6.0));`
    )
    expect(evalCode).toContain(
      `${n(3)} = min(min(${child(nodes[3], 0)}, 7.0), 8.0);`
    )
    expect(evalCode).toContain(`${n(4)} = max(1.0, ${child(nodes[4], 1)});`)
    // the first read is shared with nothing; the objective eval only holds
    // the objective's own subtree
    expect(generated.evalObjective).toContain(`${n(0)} = (2.0 +`)
  })

  test('dead zero branches are folded away', () => {
    // prod(0, dynamic-subtree) folds to 0, so the whole node is constant
    const nodes = [
      prod(constant(0), read({ q: 'atk_' })),
      sum(prod(constant(0), read({ q: 'atk_' })), read({ q: 'dmg_' })),
    ]
    const generated = compileWgsl(nodes, opts)
    expect(generated.folded.get(nodes[0])).toBe(0)
    // the sum (a constraint root here) drops the zero term: only the dynamic
    // read survives, and it lives in the constraint eval section
    const dynRead = generated.names.get((nodes[1] as any).x[1])
    expect(generated.evalConstraints).toContain(
      `${generated.names.get(nodes[1])} = (${dynRead});`
    )
    // constant-only subtrees fold entirely away (no statements emitted)
    const constNodes = [sum(constant(1), constant(2)), prod()]
    const constGenerated = compileWgsl(constNodes, opts)
    expect(constGenerated.folded.get(constNodes[0])).toBe(3)
    expect(constGenerated.folded.get(constNodes[1])).toBe(1)
    expect(constGenerated.evalConstraints + constGenerated.evalObjective).toBe(
      ''
    )
  })

  test('thres and match fold or rewrite constant branches', () => {
    const nodes = [
      cmpGE(
        read({ q: 'atk_' }),
        constant(50),
        read({ q: 'crit_p' }),
        read({ q: 'dmg_' })
      ),
      cmpEq(constant(3), constant(4), constant(3), constant(5)),
    ]
    const generated = compileWgsl(nodes, opts)
    const n = (i: number) => generated.names.get(nodes[i])
    const ge = nodes[0] as any
    // match with both branches constant folds to the taken branch (x[1] = 5)
    expect(generated.folded.get(nodes[1])).toBe(5)
    // thres with a dynamic comparison keeps the select; the folded 50 inlines
    expect(generated.evalObjective).toContain(
      `${n(0)} = select(${generated.names.get(ge.x[1])}, ${generated.names.get(ge.x[0])}, ${generated.names.get(ge.br[0])} >= 50.0);`
    )
  })

  test('thres with constant condition rewrites to the taken branch', () => {
    // 50 >= 2 is statically true -> evaluate x[0], never x[1]
    const nodes = [
      cmpGE(
        constant(50),
        constant(2),
        read({ q: 'atk_' }),
        read({ q: 'crit_p' })
      ),
    ]
    const generated = compileWgsl(nodes, opts)
    const taken = generated.names.get((nodes[0] as any).x[0])
    expect(generated.evalObjective).toContain(
      `${generated.names.get(nodes[0])} = ${taken};`
    )
  })

  test('subscript hoists its values array and clamps the index', () => {
    const nodes = [subscript(read({ q: 'subs_' }), [0.0, 1.5, 2.5, 3.5])]
    const generated = compileWgsl(nodes, opts)
    const n = generated.names.get(nodes[0])
    const br = generated.names.get((nodes[0] as any).br[0])
    expect(generated.prelude).toContain(
      'var sub0: array<f32, 4> = array<f32, 4>(0.0, 1.5, 2.5, 3.5);'
    )
    expect(generated.evalObjective).toContain(
      `${n} = sub0[u32(clamp(${br}, 0.0, 3.0))];`
    )
  })

  test('only live coordinates are reported', () => {
    const nodes = [
      sum(read({ q: 'atk_' }), read({ q: 'missing' }), read({ q: 'dmg_' })),
    ]
    const generated = compileWgsl(nodes, opts)
    expect(generated.liveCoordKeys).toEqual(['atk_', 'dmg_'])
    expect(generated.liveCoordIndex.get(0)).toBe(0)
    expect(generated.liveCoordIndex.get(2)).toBe(1)
    expect(generated.coordCount).toBe(2)
  })

  test('throws on unsupported ops', () => {
    const lookupNode = { op: 'lookup', x: [], br: [constant(0)], ex: {} }
    expect(() => compileWgsl([lookupNode as any], opts)).toThrow(/unsupported/)
    const customNode = { op: 'custom', x: [], br: [], ex: 'foo' }
    expect(() => compileWgsl([customNode as any], opts)).toThrow(/unsupported/)
    const strConst = { op: 'const', x: [], br: [], ex: 'foo' }
    expect(() => compileWgsl([strConst as any], opts)).toThrow(/unsupported/)
    const strSubscript = {
      op: 'subscript',
      x: [],
      br: [constant(0)],
      ex: ['a', 'b'],
    }
    expect(() => compileWgsl([strSubscript as any], opts)).toThrow(
      /unsupported/
    )
  })

  test('emits WGSL floor for the floor custom op', () => {
    const nodes = [custom('floor', read({ q: 'atk_' }))]
    const generated = compileWgsl(nodes, opts)
    expect(generated.evalObjective).toContain(
      `${generated.names.get(nodes[0])} = floor(${generated.names.get((nodes[0] as any).x[0])});`
    )
  })
})

describe('parity with pando compile', () => {
  const coordKeys = ['atk_', 'crit_p', 'dmg_', 'subs_', 'set_cnt', 'atk_pct_']
  const slotCount = 3
  const opts = { dynTagCat: 'q', slotCount, coordKeys }

  function makeCandidates() {
    const values = [0, 1, 2, 3, 0.5, 1.5, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    const pick = (n: number, keys: string[]) => {
      const out: Record<string, number> = {}
      for (let k = 0; k < keys.length; k++)
        out[keys[k]] = values[(k * 3 + n) % values.length]
      return out
    }
    return [
      [0, 1, 2, 3].map((n) => pick(n, coordKeys)),
      [0, 1, 2].map((n) => pick(n + 4, coordKeys)),
      [0, 1, 2, 3, 4].map((n) => pick(n + 8, coordKeys)),
    ]
  }

  test('objective and constraints evaluate identically', () => {
    const candidates = makeCandidates()
    const nodes: NumTagFree[] = [
      sum(
        prod(constant(100), read({ q: 'atk_' })),
        read({ q: 'crit_p' }),
        sumfrac(read({ q: 'atk_pct_' }), constant(3)),
        max(read({ q: 'dmg_' }), read({ q: 'set_cnt' })),
        min(read({ q: 'subs_' }), constant(4))
      ),
      cmpGE(
        read({ q: 'atk_' }),
        constant(50),
        read({ q: 'crit_p' }),
        read({ q: 'dmg_' })
      ),
      cmpEq(constant(3), constant(4), constant(3), constant(5)),
      subscript(min(read({ q: 'subs_' }), constant(3)), [0.0, 1.5, 2.5, 3.5]),
      read({ q: 'not_in_pool' }),
    ]

    const generated = compileWgsl(nodes, opts)
    const flat = candidates.flat()
    const coords = new Float32Array(flat.length * coordKeys.length)
    // Column-major (SoA) layout, matching the shader's coords matrix
    for (let k = 0; k < coordKeys.length; k++)
      for (let r = 0; r < flat.length; r++)
        coords[k * flat.length + r] =
          (flat[r] as Record<string, number>)[coordKeys[k]] ?? 0

    const ref = compile(nodes, 'q', slotCount)

    for (let build = 0; build < 200; build++) {
      const idx = [
        (build * 7) % candidates[0].length,
        (build * 5 + 1) % candidates[1].length,
        (build * 3 + 2) % candidates[2].length,
      ]
      const expected = ref(idx.map((i, s) => candidates[s][i]))
      const sizes = candidates.map((c) => c.length)
      const actual = evaluateWgsl(
        generated,
        coords,
        idx,
        sizes,
        coordKeys.length,
        nodes
      )
      for (let n = 0; n < nodes.length; n++)
        expect(actual[n]).toBeCloseTo(expected[n], 8)
    }
  })

  test('f16 quantized coords match the CPU reference', () => {
    // Full f16 pipeline: coords packed to half, quantized back through the
    // f16->f32 load cast, then the f16-emitted expressions (with `f32()`
    // wrappers stripped) must equal the pando compile over the ORIGINAL
    // values. All candidate values are small integers/halves — exact in f16,
    // so quantization is lossless and parity must hold.
    const candidates = makeCandidates()
    const nodes: NumTagFree[] = [
      sum(
        prod(constant(100), read({ q: 'atk_' })),
        read({ q: 'crit_p' }),
        sumfrac(read({ q: 'atk_pct_' }), constant(3)),
        max(read({ q: 'dmg_' }), read({ q: 'set_cnt' })),
        min(read({ q: 'subs_' }), constant(4))
      ),
      cmpGE(
        read({ q: 'atk_' }),
        constant(50),
        read({ q: 'crit_p' }),
        read({ q: 'dmg_' })
      ),
      read({ q: 'not_in_pool' }),
    ]
    const generated = compileWgsl(nodes, { ...opts, f16: true })
    const flat = candidates.flat()
    const raw = new Float32Array(flat.length * coordKeys.length)
    for (let k = 0; k < coordKeys.length; k++)
      for (let r = 0; r < flat.length; r++)
        raw[k * flat.length + r] =
          (flat[r] as Record<string, number>)[coordKeys[k]] ?? 0
    // the GPU stores halfs and casts back on load; feed the evaluator the
    // same quantized values
    const coords = unpackF16(packF16(raw))

    const ref = compile(nodes, 'q', slotCount)
    const sizes = candidates.map((c) => c.length)
    for (let build = 0; build < 200; build++) {
      const idx = [
        (build * 7) % candidates[0].length,
        (build * 5 + 1) % candidates[1].length,
        (build * 3 + 2) % candidates[2].length,
      ]
      const expected = ref(idx.map((i, s) => candidates[s][i]))
      const actual = evaluateWgsl(
        generated,
        coords,
        idx,
        sizes,
        coordKeys.length,
        nodes,
        true
      )
      for (let n = 0; n < nodes.length; n++)
        expect(actual[n]).toBeCloseTo(expected[n], 8)
    }
  })

  test('slot-restricted coordinates evaluate identically to the reference', () => {
    // slot 0 candidates carry only a_, slot 1 only b_. The matrix zero-fills
    // the missing cells; the CPU reference reads missing keys as 0, so the
    // availability-aware emission must match it exactly.
    const candidates = [
      [{ a_: 10 }, { a_: 20 }],
      [{ b_: 3 }, { b_: 4 }, { b_: 5 }],
    ]
    const keys = ['a_', 'b_']
    const nodes: NumTagFree[] = [
      sum(read({ q: 'a_' }), read({ q: 'b_' })),
      cmpGE(read({ q: 'a_' }), constant(12), constant(1), constant(0)),
    ]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: keys,
      slotCoordKeys: [['a_'], ['b_']],
    })
    const flat = candidates.flat()
    const coords = new Float32Array(flat.length * keys.length)
    for (let k = 0; k < keys.length; k++)
      for (let r = 0; r < flat.length; r++)
        coords[k * flat.length + r] =
          (flat[r] as Record<string, number>)[keys[k]] ?? 0

    const ref = compile(nodes, 'q', 2)
    const sizes = candidates.map((c) => c.length)
    for (let a = 0; a < sizes[0]; a++)
      for (let b = 0; b < sizes[1]; b++) {
        const expected = ref([candidates[0][a], candidates[1][b]])
        const actual = evaluateWgsl(
          generated,
          coords,
          [a, b],
          sizes,
          keys.length,
          nodes
        )
        for (let n = 0; n < nodes.length; n++)
          expect(actual[n]).toBeCloseTo(expected[n], 8)
      }
  })

  test('dead coordinates fold identically to a full evaluation', () => {
    // Reads of keys absent from the candidate pool must evaluate to 0 on both
    // paths — the fold must not change results when other coords are live.
    const candidates = makeCandidates()
    const nodes: NumTagFree[] = [
      sum(
        prod(read({ q: 'not_in_pool' }), read({ q: 'atk_' }), constant(7)),
        read({ q: 'crit_p' })
      ),
      prod(constant(0), read({ q: 'atk_' })),
    ]
    const generated = compileWgsl(nodes, opts)
    expect(generated.folded.get(nodes[1])).toBe(0)
    const flat = candidates.flat()
    const coords = new Float32Array(flat.length * coordKeys.length)
    for (let k = 0; k < coordKeys.length; k++)
      for (let r = 0; r < flat.length; r++)
        coords[k * flat.length + r] =
          (flat[r] as Record<string, number>)[coordKeys[k]] ?? 0

    const ref = compile(nodes, 'q', slotCount)
    const sizes = candidates.map((c) => c.length)
    for (let build = 0; build < 100; build++) {
      const idx = [
        build % candidates[0].length,
        (build * 3) % candidates[1].length,
        (build * 5) % candidates[2].length,
      ]
      const expected = ref(idx.map((i, s) => candidates[s][i]))
      const actual = evaluateWgsl(
        generated,
        coords,
        idx,
        sizes,
        coordKeys.length,
        nodes
      )
      for (let n = 0; n < nodes.length; n++)
        expect(actual[n]).toBeCloseTo(expected[n], 8)
    }
  })
})

describe('mixed radix dispatch math', () => {
  const sizes = [4, 3, 5, 2]
  const permLimit = sizes.reduce((n, s) => n * s, 1)

  test('decodeChunk inverts dispatchStartIndices over the full space', () => {
    for (let start = 0; start < permLimit; start += 7) {
      const bases = dispatchStartIndices(start, sizes)
      for (let local = 0; local < permLimit - start; local++) {
        const indices = decodeChunk(local, bases, sizes)
        let acc = 0
        for (let s = sizes.length - 1; s >= 0; s--)
          acc = acc * sizes[s] + indices[s]
        expect(acc).toBe(start + local)
      }
    }
  })

  test('chunked sweep covers the whole space', () => {
    const seen = new Set<string>()
    for (let start = 0; start < permLimit; start += 9) {
      const bases = dispatchStartIndices(start, sizes)
      for (let local = 0; local < 9 && start + local < permLimit; local++)
        seen.add(decodeChunk(local, bases, sizes).join('/'))
    }
    expect(seen.size).toBe(permLimit)
  })
})

describe('shader section generation', () => {
  test('index decode folds bases and emits wrap propagation', () => {
    const { init, carry } = generateIndexDecode(3)
    expect(init).toContain('var idx0 = (u32(params.x0) + o0) % size0;')
    expect(init).toContain(
      'let carry1 = (u32(params.x1) + o1 + carry0) / size1;'
    )
    expect(init).toContain('var idx2 = (u32(params.x2) + o2 + carry1) % size2;')
    expect(carry).toContain('idx0 += 1u;')
    expect(carry).toContain('if (idx1 >= size1) {')
    expect(carry).toContain('idx2 += 1u;')
  })

  test('constraint filter early-outs before the objective', () => {
    const nodes = [read({ q: 'a_' }), read({ q: 'b_' }), constant(Infinity)]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_', 'b_'],
    })
    const constraint = generateConstraintFilter(
      [-Infinity, 50, Infinity],
      generated.names,
      generated.folded,
      nodes
    )
    const objective = generated.names.get(nodes[0])!
    const filter = generateObjectiveFilter(objective)
    expect(constraint).toContain('(50.0 >')
    expect(constraint).toContain('continue')
    expect(filter).toContain(`(${objective} <= params.threshold)`)
    expect(filter).toContain('atomicAdd(&compactCount, 1u)')
    expect(filter).toContain('CompactEntry(u32(cycleIndex + i)')
    expect(filter).toContain('localValidCount += 1u;')
  })

  test('folded constraints are inlined as literals', () => {
    // constant(Infinity) folds; the constraint check uses the literal
    const nodes = [read({ q: 'a_' }), constant(Infinity)]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_'],
    })
    const constraint = generateConstraintFilter(
      [-Infinity, Infinity],
      generated.names,
      generated.folded,
      nodes
    )
    expect(generated.folded.get(nodes[1])).toBe(Infinity)
    expect(constraint).toContain('3.4028234663852886e+38')
  })

  test('bakes tunable workgroup size and cycles per invocation', () => {
    const nodes = [read({ q: 'a_' })]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_'],
    })
    const wgsl = generateWgsl({
      slotCount: 2,
      slotSizes: [2, 2],
      minimum: [-Infinity],
      nodes,
      generated,
      compactLimit: 100,
      workgroupSize: 512,
      cyclesPerInvocation: 1024,
    })
    expect(wgsl).toContain('@workgroup_size(512)')
    expect(wgsl).toContain('let cycleIndex = indexGlobal * 1024;')
    expect(wgsl).toContain(
      'if (i >= 1024 || cycleIndex + i >= params.permLimit)'
    )
    // defaults stay at the proven 256/256
    const defaultWgsl = generateWgsl({
      slotCount: 2,
      slotSizes: [2, 2],
      minimum: [-Infinity],
      nodes,
      generated,
      compactLimit: 100,
    })
    expect(defaultWgsl).toContain('@workgroup_size(256)')
    expect(defaultWgsl).toContain('indexGlobal * 256')
  })

  test('f16 flag swaps the coords storage declaration', () => {
    const nodes = [read({ q: 'a_' })]
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: 2,
      coordKeys: ['a_'],
    })
    const f16Wgsl = generateWgsl({
      slotCount: 2,
      slotSizes: [2, 2],
      minimum: [-Infinity],
      nodes,
      generated,
      compactLimit: 100,
      f16: true,
    })
    // the bind attributes must survive injection, or the buffer silently
    // loses its binding and every coordinate read returns 0
    expect(f16Wgsl).toContain(
      '@group(1) @binding(0) var<storage, read> coords : array<f16>;'
    )
    const f32Wgsl = generateWgsl({
      slotCount: 2,
      slotSizes: [2, 2],
      minimum: [-Infinity],
      nodes,
      generated,
      compactLimit: 100,
    })
    expect(f32Wgsl).toContain(
      '@group(1) @binding(0) var<storage, read> coords : array<f32>;'
    )
  })
})

/** Decode IEEE-754 half bits back to f32 (mirrors the GPU's f16->f32 loads). */
function unpackF16(packed: Uint16Array): Float32Array {
  const out = new Float32Array(packed.length)
  for (let i = 0; i < packed.length; i++) {
    const bits = packed[i]
    const sign = bits & 0x8000 ? -1 : 1
    const hi = bits & 0x7c00
    const lo = bits & 0x3ff
    if (hi === 0x7c00) {
      out[i] = sign * Infinity
      continue
    }
    out[i] = hi
      ? sign * (1 + lo / 1024) * 2 ** ((hi >> 10) - 15)
      : sign * (lo / 1024) * 2 ** -14
  }
  return out
}

describe('adaptive chunk sizing', () => {
  test('targets a few dispatches for large permutation spaces', () => {
    const perms = 2_422_746_600 // the user's real app config
    // 4 chunks by default (hsr's TARGET_ITERATIONS)
    expect(computeChunkSize(perms, TARGET_CHUNKS)).toBe(Math.ceil(perms / 4))
    // explicit override: 2 chunks => half the space each
    expect(computeChunkSize(perms, 2)).toBe(Math.ceil(perms / 2))
  })

  test('clamps to the u32-safe ceiling and the small-pool floor', () => {
    expect(computeChunkSize(Number.MAX_SAFE_INTEGER, TARGET_CHUNKS)).toBe(
      MAX_CHUNK
    )
    // a single oversized chunk would wrap the shader's u32 cycleIndex
    expect(computeChunkSize(2 ** 32, 1)).toBe(MAX_CHUNK)
    // tiny spaces still floor to MIN_CHUNK (the caller then uses whatever
    // remains of permLimit, so they get one dispatch)
    expect(computeChunkSize(1_000, TARGET_CHUNKS)).toBe(MIN_CHUNK)
    expect(computeChunkSize(100_000, TARGET_CHUNKS)).toBe(MIN_CHUNK)
  })

  test('max chunk stays on a single dispatch axis at default tuning', () => {
    // MAX_CHUNK / (256 threads x 256 cycles) = 2^15 workgroups < 65,535, so
    // workgroup_index = workgroup_id.x can't wrap in the u32 decode math
    const groupCount = Math.ceil(MAX_CHUNK / (256 * 256))
    const [x, y, z] = dispatchWorkgroups(groupCount)
    expect(x).toBe(groupCount)
    expect(y).toBe(1)
    expect(z).toBe(1)
  })

  test('sanitizeTuning rejects invalid targetChunks', () => {
    expect(sanitizeTuning({ targetChunks: 0 }).targetChunks).toBe(TARGET_CHUNKS)
    expect(sanitizeTuning({ targetChunks: NaN }).targetChunks).toBe(
      TARGET_CHUNKS
    )
    expect(sanitizeTuning({ targetChunks: -3 }).targetChunks).toBe(
      TARGET_CHUNKS
    )
    expect(sanitizeTuning({ targetChunks: 2 }).targetChunks).toBe(2)
  })
})

describe('TDR budgeted chunk sizing', () => {
  test('caps chunk size to the time budget', () => {
    // 500 perms/ms x 1000ms budget = 500k perms per dispatch
    expect(computeBudgetedChunkSize(500, 1000)).toBe(500_000)
    // slower device => smaller chunks (above the 2^18 floor)
    expect(computeBudgetedChunkSize(300, 1000)).toBe(300_000)
    // larger budget => larger chunks
    expect(computeBudgetedChunkSize(500, 2000)).toBe(1_000_000)
  })

  test('clamps to the u32 ceiling and a sane floor', () => {
    expect(computeBudgetedChunkSize(1e9, 1000)).toBe(MAX_CHUNK)
    // degenerate near-zero rate can't produce absurdly tiny chunks
    expect(computeBudgetedChunkSize(0.001, 1000)).toBe(1 << 18)
  })

  test('sanitizeTuning clamps chunkMs to a sane range', () => {
    expect(sanitizeTuning({}).chunkMs).toBe(MAX_CHUNK_MS)
    expect(sanitizeTuning({ chunkMs: NaN }).chunkMs).toBe(MAX_CHUNK_MS)
    expect(sanitizeTuning({ chunkMs: 10 }).chunkMs).toBe(MAX_CHUNK_MS)
    expect(sanitizeTuning({ chunkMs: 10_000 }).chunkMs).toBe(MAX_CHUNK_MS)
    expect(sanitizeTuning({ chunkMs: 500 }).chunkMs).toBe(500)
  })
})

describe('packF16', () => {
  test('round-trips realistic stat values', () => {
    const values = [0, 1, 1.5, 100, 2048, -3, 0.5, 42.25, -0.25]
    const packed = packF16(new Float32Array(values))
    for (let i = 0; i < values.length; i++) {
      const hi = packed[i] & 0x7c00
      const lo = packed[i] & 0x3ff
      const sign = packed[i] & 0x8000 ? -1 : 1
      // normal: 1.frac x 2^(e-15); subnormal/zero: frac/1024 x 2^-14
      const decoded = hi
        ? sign * (1 + lo / 1024) * 2 ** ((hi >> 10) - 15)
        : sign * (lo / 1024) * 2 ** -14
      expect(decoded).toBeCloseTo(values[i], 4)
    }
    // exact for integers within f16's 11-bit significand
    expect(packed[0]).toBe(0)
    expect(packed[2]).toBe(0x3e00) // 1.5
    expect(packed[4]).toBe(0x6800) // 2048
  })

  test('handles overflow and negative values', () => {
    const packed = packF16(new Float32Array([65504, 1e6, -2]))
    expect(packed[1] & 0x7fff).toBe(0x7c00) // 1e6 overflows to Inf
    expect(packed[0] & 0x7fff).toBe(0x7bff) // 65504 = max finite half
    expect(packed[2]).toBe(0xc000) // -2
  })
})
