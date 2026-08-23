import type { NumTagFree } from '@zenless-optimizer/pando/engine'

export const MAX_F32 = '3.4028234663852886e+38'

/**
 * WGSL `f32` literal formatting for a JS number.
 * WGSL requires a decimal point on float literals and has no Infinity/NaN
 * literals, so those are mapped to the largest representable `f32` value.
 */
export function f32Literal(value: number): string {
  if (Number.isNaN(value)) return '0.0'
  if (value === Infinity) return MAX_F32
  if (value === -Infinity) return `-${MAX_F32}`
  const s = String(value)
  const m = /^([+-]?\d+)([eE][+-]?\d+)?$/.exec(s)
  if (m) return `${m[1]}.0${m[2] ?? ''}`
  return s
}

export interface WgslCompileOptions {
  dynTagCat: string
  slotCount: number
  /** ordered coordinate names; index = coordinate index into the candidate matrix */
  coordKeys: string[]
  /**
   * Candidate matrix is `array<f16>` (half the bytes of f32; exact for the
   * small integer stat values ZZZ discs produce). Reads cast with `f32()`.
   */
  f16?: boolean
  /**
   * Per-slot coordinate availability: for each slot, the set of coord keys
   * its candidates actually carry (in slot order 0..N-1). A read of a
   * coordinate only sums over the slots that have the key — a coordinate
   * absent from slot 0 becomes a pure hoisted-base read (no per-cycle load),
   * and a coordinate confined to slot 0 skips the base entirely (no wrap
   * recompute). When omitted, every slot is assumed to carry every key.
   */
  slotCoordKeys?: string[][]
}

export interface WgslCompileResult {
  /** hoisted function-scope `var` arrays for `subscript` nodes */
  prelude: string
  /**
   * `var base_{k}: f32 = <slots 1..N-1 that carry the key sum>;` per read
   * coordinate that spans the slowly-varying slots. The sum is loop-invariant
   * for a whole invocation (only slot 0 changes every cycle), so it is hoisted
   * out of the cycle loop and recomputed only when the carry chain wraps slot
   * 0. Coordinates confined to slot 0 get no base (their value changes every
   * cycle).
   */
  readBaseInit: string
  /** `base_{k} = <same sum>;` injected inside the carry-chain wrap */
  readBaseUpdate: string
  /**
   * Statements for the constraint subtrees (`nodes[1..]` and everything they
   * transitively reference), in dependency order. The constraint filter check
   * is injected right after this, so builds failing a constraint skip the
   * (expensive) objective evaluation entirely — mirroring the HSR solver's
   * "basic stat filters before unrolled actions" early-out.
   */
  evalConstraints: string
  /** Statements exclusive to the objective (`nodes[0]`), in dependency order. */
  evalObjective: string
  /** node -> variable name (only nodes emitted into the eval sections) */
  names: Map<NumTagFree, string>
  /**
   * node -> constant value for nodes fully evaluated at compile time. Reads of
   * coordinates absent from the candidate pool are constant 0, and constant
   * propagation through the formula tree eliminates the whole dead subtree
   * (e.g. every wengine/disc-set conditional for a key not in the pool).
   */
  folded: Map<NumTagFree, number>
  /**
   * Coordinate keys actually referenced by *live* (non-folded) reads, in
   * original `coordKeys` order. The candidate matrix can be shrunk to just
   * these columns.
   */
  liveCoordKeys: string[]
  /** original coordinate index -> index within `liveCoordKeys` */
  liveCoordIndex: Map<number, number>
  /** number of live coordinates (column count of the shader's coords matrix) */
  coordCount: number
}

function unsupported(op: string): Error {
  return new Error(`GPU solver: unsupported node op '${op}'`)
}

/**
 * Compile a tag-free Pando node graph to WGSL expressions, mirroring
 * `executionStr` from `@zenless-optimizer/pando/engine`. `read` nodes expand to
 * a sum over slots of candidate-matrix lookups: the compute shader exposes
 * `idx0..idx{N-1}` (per-slot candidate indices) and `coords`/`rows`/`f{slot}`
 * (column-major candidate matrix, row count, float slot offsets).
 *
 * Reads of coordinates not present in the candidate pool are known to be 0, so
 * a constant-propagation pass folds away entire dead subtrees (the real ZZZ
 * formula references conditionals for *all* wengine/disc-set keys; only the
 * handful actually in the pool survive). This is the single largest per-cycle
 * cost reduction available: ~90% of the formula is dead for a typical pool.
 */
export function compileWgsl(
  nodes: NumTagFree[],
  options: WgslCompileOptions
): WgslCompileResult {
  const { dynTagCat, slotCount, coordKeys } = options
  const coordIndex = new Map(coordKeys.map((k, i) => [k, i]))
  const names = new Map<NumTagFree, string>()
  const folded = new Map<NumTagFree, number>()
  let prelude = ''
  const evalByNode = new Map<NumTagFree, string>()
  let subscriptIdx = 0
  /** read coordinates referenced by live reads (original index) */
  const readCoords = new Set<number>()
  /** coordinate indices whose read spans slots 1..N-1 (need a hoisted base) */
  const hasBase = new Set<number>()

  // Per-slot availability: which coord keys each slot's candidate pool
  // actually carries. A read only sums over slots with the key — a coord
  // absent from slot 0 is a pure hoisted-base read (zero per-cycle loads),
  // and a coord confined to slot 0 needs no base at all. When `slotCoordKeys`
  // is omitted, every slot is assumed to carry every key (legacy behavior).
  const slotKeySets = (options.slotCoordKeys ?? []).map((keys) => new Set(keys))
  const slotHasKey = (s: number, key: string): boolean => {
    if (slotKeySets.length === 0) return true
    // A missing per-slot set (mismatched slotCoordKeys length) conservatively
    // assumes the slot carries every key — never `false`, which would
    // silently zero out that slot's contribution.
    return slotKeySets[s]?.has(key) ?? true
  }

  // f16 storage loads are cast to f32 at the read site (the base sums stay
  // f32, matching the JS reference arithmetic)
  const load = (indexExpr: string): string =>
    options.f16 ? `f32(coords[${indexExpr}])` : `coords[${indexExpr}]`

  const readStr = (n: NumTagFree): string => {
    const k = coordIndex.get(n.tag![dynTagCat]!)
    if (k === undefined) return '(0.0)' // unreachable: missing coords fold earlier
    readCoords.add(k)
    const key = coordKeys[k]
    // Column-major (SoA) layout: `coords[k * rows + (f{s} + idx{s})]`. The
    // fastest-varying slot (0) then reads *contiguous* memory across a warp
    // (coalesced), instead of strided rows.
    if (slotCount === 1) return `(${load(`${k} * rows + (f0 + idx0)`)})`
    // Slots 1..N-1 change at most once per `size0` cycles; their sum is kept
    // in `base_{k}` (initialized before the loop, refreshed on carry wrap).
    // Only slots carrying the key contribute, so a coord absent from slot 0
    // reads `base_k` alone — the slot-0 term is provably zero and the load is
    // dropped from the per-cycle path entirely.
    let hasHigh = false
    for (let s = 1; s < slotCount; s++) {
      if (slotHasKey(s, key)) {
        hasHigh = true
        break
      }
    }
    if (hasHigh) {
      hasBase.add(k)
      const slot0 = slotHasKey(0, key)
        ? ` + ${load(`${k} * rows + (f0 + idx0)`)}`
        : ''
      return `(base_${k}${slot0})`
    }
    // confined to slot 0 (or slot 0 alone): direct per-cycle load, no base
    return `(${load(`${k} * rows + (f0 + idx0)`)})`
  }

  /**
   * Constant-fold a subtree. Returns the constant value, or `undefined` when
   * the node depends on live (per-cycle) data. Folded values are all finite:
   * they are built only from numeric constants and the literal `0` of absent
   * reads, so `prod(0, x) -> 0` is safe (no NaN/Inf sources inside folded
   * subtrees; dynamic subtrees are never folded).
   */
  const foldOf = (n: NumTagFree): number | undefined => {
    if (folded.has(n)) return folded.get(n)
    const x = (n.x ?? []) as NumTagFree[]
    const br = (n.br ?? []) as NumTagFree[]
    let v: number | undefined
    switch (n.op) {
      case 'const':
        v = typeof n.ex === 'number' ? (n.ex as number) : undefined
        break
      case 'read': {
        const k = n.tag![dynTagCat]
        v = k !== undefined && k !== null && coordIndex.has(k) ? undefined : 0
        break
      }
      case 'sum': {
        let acc = 0
        let all = true
        for (const c of x) {
          const cv = foldOf(c)
          if (cv === undefined) {
            all = false
          } else acc += cv
        }
        v = all ? acc : undefined
        break
      }
      case 'prod': {
        let acc = 1
        let all = true
        for (const c of x) {
          const cv = foldOf(c)
          if (cv === undefined) {
            all = false
            continue
          }
          if (cv === 0) {
            // 0 * anything = 0 (folded factors are finite by construction)
            acc = 0
            break
          }
          acc *= cv
        }
        v = all ? acc : undefined
        break
      }
      case 'min':
      case 'max': {
        let acc: number | undefined
        let all = true
        for (const c of x) {
          const cv = foldOf(c)
          if (cv === undefined) {
            all = false
            continue
          }
          acc =
            acc === undefined
              ? cv
              : n.op === 'min'
                ? Math.min(acc, cv)
                : Math.max(acc, cv)
        }
        v = all ? (acc ?? (n.op === 'min' ? Infinity : -Infinity)) : undefined
        break
      }
      case 'sumfrac': {
        const a = foldOf(x[0])
        const b = foldOf(x[1])
        v = a !== undefined && b !== undefined ? a / (a + b) : undefined
        break
      }
      case 'thres': {
        const v1 = foldOf(br[0])
        const v2 = foldOf(br[1])
        if (v1 !== undefined && v2 !== undefined)
          v = v1 >= v2 ? foldOf(x[0]) : foldOf(x[1])
        break
      }
      case 'match': {
        const v1 = foldOf(br[0])
        const v2 = foldOf(br[1])
        if (v1 !== undefined && v2 !== undefined)
          v = v1 === v2 ? foldOf(x[0]) : foldOf(x[1])
        break
      }
      case 'subscript': {
        const i = foldOf(br[0])
        const vals = n.ex as unknown[]
        if (
          i !== undefined &&
          Number.isFinite(i) &&
          vals.every((val) => typeof val === 'number')
        ) {
          const idx = Math.min(Math.max(Math.floor(i), 0), vals.length - 1)
          v = vals[idx] as number
        }
        break
      }
      default:
        v = undefined // lookup / custom / unknown ops stay dynamic (or throw)
    }
    if (v !== undefined) folded.set(n, v)
    return v
  }

  const childStr = (c: NumTagFree): string => {
    const cv = foldOf(c)
    if (cv !== undefined) return f32Literal(cv)
    const name = names.get(c)
    if (name === undefined)
      throw unsupported((c as unknown as { op: string }).op)
    return name
  }

  /**
   * Emit the WGSL expression for a dynamic node. Folded children are inlined
   * as constants (and dead branches/zero factors dropped).
   */
  const buildExpr = (n: NumTagFree): string => {
    const x = (n.x ?? []) as NumTagFree[]
    const br = (n.br ?? []) as NumTagFree[]
    switch (n.op) {
      case 'const':
        if (typeof n.ex === 'string')
          throw unsupported(
            'const<string> (dynamic string values cannot be represented in WGSL)'
          )
        return f32Literal(n.ex) // unreachable: numeric consts fold
      case 'read':
        return readStr(n)
      case 'sum': {
        let acc = 0
        const dyn: string[] = []
        for (const c of x) {
          const cv = foldOf(c)
          if (cv === undefined) dyn.push(childStr(c))
          else acc += cv
        }
        if (dyn.length === 0) return f32Literal(acc) // unreachable: folds
        return `(${acc !== 0 ? `${f32Literal(acc)} + ` : ''}${dyn.join(' + ')})`
      }
      case 'prod': {
        let acc = 1
        const dyn: string[] = []
        for (const c of x) {
          const cv = foldOf(c)
          if (cv === undefined) dyn.push(childStr(c))
          else acc *= cv
        }
        if (dyn.length === 0) return f32Literal(acc) // unreachable: folds
        if (acc === 0) return '(0.0)' // unreachable: folds
        return `(${acc !== 1 ? `${f32Literal(acc)} * ` : ''}${dyn.join(' * ')})`
      }
      case 'min':
      case 'max': {
        if (!x.length) throw unsupported('min/max without arguments')
        const args = x.map(childStr)
        return args.slice(1).reduce((a, b) => `${n.op}(${a}, ${b})`, args[0])
      }
      case 'sumfrac':
        return `(${childStr(x[0])} / (${childStr(x[0])} + ${childStr(x[1])}))`
      case 'thres': {
        const b0 = foldOf(br[0])
        const b1 = foldOf(br[1])
        // Both branches constant: rewrite to the taken branch (also correct
        // for NaN branch operands, which would otherwise be mangled by the
        // NaN -> 0.0 literal mapping).
        if (b0 !== undefined && b1 !== undefined)
          return b0 >= b1 ? childStr(x[0]) : childStr(x[1])
        return `select(${childStr(x[1])}, ${childStr(x[0])}, ${childStr(br[0])} >= ${childStr(br[1])})`
      }
      case 'match': {
        const b0 = foldOf(br[0])
        const b1 = foldOf(br[1])
        if (b0 !== undefined && b1 !== undefined)
          return b0 === b1 ? childStr(x[0]) : childStr(x[1])
        return `select(${childStr(x[1])}, ${childStr(x[0])}, ${childStr(br[0])} == ${childStr(br[1])})`
      }
      case 'subscript': {
        const values = n.ex as unknown[]
        if (values.some((v) => typeof v === 'string'))
          throw unsupported('subscript<string>')
        const len = values.length
        if (len === 0) throw unsupported('subscript with empty array')
        const arr = `sub${subscriptIdx}`
        subscriptIdx += 1
        prelude += `var ${arr}: array<f32, ${len}> = array<f32, ${len}>(${values
          .map((v) => f32Literal(v as number))
          .join(', ')});\n`
        return `${arr}[u32(clamp(${childStr(br[0])}, 0.0, ${len - 1}.0))]`
      }
      case 'lookup':
        throw unsupported('lookup (dynamic string key)')
      case 'custom':
        if (n.ex === 'floor') return `floor(${childStr(x[0])})`
        throw unsupported(`custom '${n.ex}'`)
      default:
        throw unsupported((n as unknown as { op: string }).op)
    }
  }

  const walk = (n: NumTagFree): void => {
    if (names.has(n) || folded.has(n)) return
    // Fold the node first: if it is constant, none of its children can
    // contribute to a live result, so they are not walked at all (otherwise
    // a dead subtree like `prod(0, read(live_key))` would leave its dynamic
    // read emitted as dead code and its coordinate marked live).
    if (foldOf(n) !== undefined) return
    const xChildren = (n.x ?? []) as NumTagFree[]
    const brChildren = (n.br ?? []) as NumTagFree[]
    xChildren.forEach(walk)
    brChildren.forEach(walk)
    const out = `x${names.size}`
    names.set(n, out)
    evalByNode.set(n, `let ${out} = ${buildExpr(n)};`)
  }

  nodes.forEach(walk)

  // Constraint closure: every node transitively referenced by a constraint
  // root (nodes[1..]). Downward-closed, so its statements can be emitted
  // before the objective-only statements without breaking dependencies.
  const constraintClosure = new Set<NumTagFree>()
  const addClosure = (n: NumTagFree): void => {
    if (!n || constraintClosure.has(n)) return
    constraintClosure.add(n)
    for (const arr of [n.x ?? [], n.br ?? []])
      for (const c of arr as NumTagFree[]) addClosure(c)
  }
  for (let c = 1; c < nodes.length; c++) addClosure(nodes[c])

  const evalConstraints: string[] = []
  const evalObjective: string[] = []
  for (const [node, stmt] of evalByNode)
    (constraintClosure.has(node) ? evalConstraints : evalObjective).push(stmt)

  // Live coordinates, in original order (index k in the shader's coords
  // matrix is the position within this list).
  const live = [...readCoords].sort((a, b) => a - b)
  const liveCoordIndex = new Map(live.map((k, i) => [k, i]))
  const liveCoordKeys = live.map((k) => coordKeys[k])

  // Loop-invariant read base: sum over the slowly-varying slots (1..N-1) —
  // and only the slots that actually carry the coordinate. Coordinates
  // confined to slot 0 get no base (their value changes every cycle).
  let readBaseInit = ''
  let readBaseUpdate = ''
  if (slotCount > 1) {
    for (const k of live) {
      if (!hasBase.has(k)) continue
      const key = coordKeys[k]
      const terms: string[] = []
      for (let s = 1; s < slotCount; s++)
        if (slotHasKey(s, key))
          terms.push(load(`${k} * rows + (f${s} + idx${s})`))
      readBaseInit += `var base_${k}: f32 = ${terms.join(' + ')};\n`
      readBaseUpdate += `base_${k} = ${terms.join(' + ')};\n`
    }
  }

  return {
    prelude,
    readBaseInit,
    readBaseUpdate,
    evalConstraints: evalConstraints.join('\n'),
    evalObjective: evalObjective.join('\n'),
    names,
    folded,
    liveCoordKeys,
    liveCoordIndex,
    coordCount: live.length,
  }
}

export interface IndexDecodeResult {
  /**
   * Statements before the loop: mixed-radix decode of the first permutation
   * (`cycleIndex`) and the per-slot base fold (`params.x{slot}` with carry).
   * Declares mutable `var idx{slot}`.
   */
  init: string
  /**
   * Statements in the loop's `continuing` block: increment the least
   * significant slot and propagate wraps. Mirrors the carry chain from the
   * HSR optimizer's naive dispatch, avoiding a full mixed-radix decode
   * (integer div/mod) on every cycle.
   */
  carry: string
}

/**
 * Batch-local mixed-radix decode + per-slot base merge. `cycleIndex` is the
 * permutation offset within the current dispatch; `params.x{slot}` is the
 * absolute candidate index of slot `{slot}` at the dispatch start. The
 * initial decode folds bases in with a carry chain, then per-cycle
 * increments + wrap propagation reproduce the same index sequence without
 * any division.
 *
 * `wrapUpdate` (optional) is emitted at the end of the outermost
 * `idx0 >= size0` wrap block, i.e. exactly when the slowly-varying slots
 * (1..N-1) may have changed. Used to refresh the hoisted read bases.
 */
export function generateIndexDecode(
  slotCount: number,
  wrapUpdate = ''
): IndexDecodeResult {
  if (slotCount < 1) throw new Error('GPU solver: no slots')

  const initLines = ['let local = cycleIndex;']
  let prev = 'local'
  for (let s = 0; s < slotCount; s++) {
    initLines.push(`let o${s} = ${prev} % size${s};`)
    if (s < slotCount - 1) {
      initLines.push(`let r${s} = ${prev} / size${s};`)
      prev = `r${s}`
    }
  }
  let prevCarry = '0u'
  for (let s = 0; s < slotCount; s++) {
    const fold =
      s === 0
        ? `u32(params.x0) + o0`
        : `u32(params.x${s}) + o${s} + ${prevCarry}`
    initLines.push(`var idx${s} = (${fold}) % size${s};`)
    if (s < slotCount - 1)
      initLines.push(`let carry${s} = (${fold}) / size${s};`)
    prevCarry = `carry${s}`
  }

  const carryLines: string[] = ['idx0 += 1u;']
  const wrap = (s: number) => {
    const indent = '  '.repeat(s)
    carryLines.push(`${indent}if (idx${s} >= size${s}) {`)
    carryLines.push(`${indent}  idx${s} = 0u;`)
    if (s < slotCount - 1) {
      carryLines.push(`${indent}  idx${s + 1} += 1u;`)
      wrap(s + 1)
    }
    if (s === 0 && wrapUpdate) {
      for (const line of wrapUpdate.trim().split('\n'))
        carryLines.push(`${indent}  ${line}`)
    }
    carryLines.push(`${indent}}`)
  }
  wrap(0)

  return { init: initLines.join('\n'), carry: carryLines.join('\n') }
}

/** Resolve a node's value for filtering: constant if folded, else its name. */
function nodeVal(
  node: NumTagFree,
  names: Map<NumTagFree, string>,
  folded: Map<NumTagFree, number>
): string {
  const cv = folded.get(node)
  if (cv !== undefined) return f32Literal(cv)
  const name = names.get(node)
  if (name === undefined)
    throw new Error('GPU solver: constraint node missing from codegen')
  return name
}

/**
 * Early-out constraint check (`minimum[1..]`). Injected right after the
 * constraint eval and before the objective eval: builds failing a constraint
 * `continue` and skip the (usually much larger) objective subtree.
 */
export function generateConstraintFilter(
  minimum: number[],
  names: Map<NumTagFree, string>,
  folded: Map<NumTagFree, number>,
  nodes: NumTagFree[]
): string {
  const conditions: string[] = []
  for (let c = 1; c < minimum.length; c++) {
    const m = minimum[c]
    const val = nodeVal(nodes[c], names, folded)
    if (!Number.isFinite(m)) {
      // `m === +Infinity` fails every finite value (matches JS `Infinity > x`),
      // and passes when `x === Infinity` (`Infinity > Infinity` is false).
      if (m === Infinity) conditions.push(`(${val} <= ${MAX_F32})`)
      continue
    }
    conditions.push(`(${f32Literal(m)} > ${val})`)
  }
  if (!conditions.length) return ''
  return `if (${conditions.join(' || ')}) {\n  continue;\n}`
}

/**
 * Objective threshold check (`params.threshold`, the rising top-K cutoff) +
 * atomic compaction. Runs after the objective eval for builds that passed
 * the constraint early-out.
 */
export function generateObjectiveFilter(objectiveVar: string): string {
  return `
if (${objectiveVar} <= params.threshold) {
  continue;
}
let slot = atomicAdd(&compactCount, 1u);
if (slot < COMPACT_LIMIT) {
  compactResults[slot] = CompactEntry(u32(cycleIndex + i), ${objectiveVar});
}
localValidCount += 1u;
`
}
