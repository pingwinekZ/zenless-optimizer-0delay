import type { NumTagFree } from '../node'
import {
  cmpEq,
  cmpGE,
  constant,
  custom,
  lookup,
  max,
  min,
  prod,
  read,
  subscript,
  sum,
  sumfrac,
} from '../node'
import { addCustomOperation } from '../util'
import { pruneRange, State, setPruneFastPathEnabled } from './prune'

/**
 * `pruneRange` has two implementations of the same test: a compiled fast path
 * that evaluates node ranges into reused buffers, and the general path that
 * allocates a range record and a `Map` per candidate. Fast path correctness is
 * load-bearing — a divergence silently drops (or keeps) the wrong candidates —
 * so every case here runs the *same* graph through both and requires identical
 * output.
 */
addCustomOperation('pruneRangeSpecIdentity', {
  range: ([r]) => ({ min: r.min, max: r.max }),
  monotonicity: () => [{ inc: true, dec: true }],
  calc: ([x]) => x as number,
})

const r0 = read({ q: 'c0' })
const r1 = read({ q: 'c1' })
const r2 = read({ q: 'c2' })
const r3 = read({ q: 'c3' })
const r4 = read({ q: 'c4' })

function runPrune(
  nodes: NumTagFree[],
  minimum: number[],
  candidates: Record<string, number>[][],
  fast: boolean
): { ids: string[][]; nodes: number; minimum: number[] } {
  setPruneFastPathEnabled(fast)
  try {
    const state = new State(nodes, minimum, structuredClone(candidates), 'q')
    state.progress = false
    pruneRange(state, 1)
    return {
      ids: state.candidates.map((cnds) => cnds.map((c) => String(c.id)).sort()),
      nodes: state.nodes.length,
      minimum: [...state.minimum],
    }
  } finally {
    setPruneFastPathEnabled(true)
  }
}

/** Candidate pools with deliberately uneven key presence across two slots. */
const pools: Record<string, number>[][] = [
  [
    { id: 1, c0: 0, c1: 3, c2: 4 },
    { id: 2, c0: 6, c1: 2, c2: 6 },
    { id: 3, c0: 10, c1: 1, c2: 6 },
    { id: 4, c1: 7, c2: 1 },
    { id: 5, c0: 4, c2: 4, c3: 9 },
  ],
  [
    { id: 6, c0: 1, c1: 1, c3: 2 },
    { id: 7, c1: 5, c2: 5, c4: 8 },
  ],
]

const cases: { name: string; nodes: NumTagFree[]; minimum: number[] }[] = [
  {
    name: 'read / sum',
    nodes: [sum(r0, r1), r0, sum(r1, r2, 3)],
    minimum: [-Infinity, 5, 4],
  },
  {
    name: 'min / max',
    nodes: [sum(r0, r1), min(r0, r1, r2), max(r0, r2), min(r1, 9)],
    minimum: [-Infinity, 0, 3, 5],
  },
  {
    name: 'prod with mixed signs',
    nodes: [
      sum(r0, r1),
      prod(r1, r2, -1),
      prod(sum(r0, -4), r1),
      prod(sum(r0, -4), sum(r1, -3)),
    ],
    minimum: [-Infinity, -50, 0, 0],
  },
  {
    name: 'thres',
    nodes: [sum(r0, r1), cmpGE(r2, 5, r0, r1), cmpGE(r0, 3, r2, r1)],
    minimum: [-Infinity, 0, 4],
  },
  {
    name: 'match',
    nodes: [sum(r0, r1), cmpEq(r2, 5, r0, r1), cmpEq(r0, 3, r2, r1)],
    minimum: [-Infinity, 0, 4],
  },
  {
    name: 'sumfrac',
    nodes: [
      sum(r0, r1),
      sumfrac(r0, r1),
      sumfrac(sum(r0, -8), r1),
      sumfrac(r0, sum(r1, -12)),
    ],
    minimum: [-Infinity, 0.5, 0, 0.5],
  },
  {
    name: 'subscript with a numeric table',
    nodes: [
      sum(r0, r1),
      subscript(r0, [44, 2, 3, 4, 5, 22, 7, 8]),
      subscript(r1, [0, 1, 2, 3, 4]),
    ],
    minimum: [-Infinity, 20, 0],
  },
  {
    name: 'subscript with a string table',
    nodes: [sum(r0, r1), subscript(r0, ['a', 'b', 'c'])],
    minimum: [-Infinity, 0],
  },
  {
    name: 'lookup',
    nodes: [
      sum(r0, r1),
      lookup(subscript(r0, ['a', 'b', 'c']), { a: r1, b: r2, c: 6 }),
      lookup(subscript(r1, [0, 1, 2]), { 0: r0, 1: r2, 2: 3 }),
    ],
    minimum: [-Infinity, 0, 0],
  },
  {
    name: 'custom',
    nodes: [
      sum(r0, r1),
      custom('pruneRangeSpecIdentity', sum(r0, r1)),
      custom('pruneRangeSpecIdentity', prod(r1, r2)),
    ],
    minimum: [-Infinity, 5, 0],
  },
  {
    name: 'keys present in only some slots',
    nodes: [sum(r0, r1), r3, r4, sum(r3, r4, r2)],
    minimum: [-Infinity, 0, 2, 0],
  },
  {
    name: 'constant-folded constraints',
    nodes: [sum(r0, r1), constant(7), sum(constant(2), r2)],
    minimum: [-Infinity, 7, 0],
  },
  {
    name: 'objective-only (never rejects)',
    nodes: [sum(r0, r1, r2)],
    minimum: [-Infinity],
  },
]

describe('pruneRange fast path', () => {
  for (const { name, nodes, minimum } of cases) {
    it(`matches the general path: ${name}`, () => {
      const general = runPrune(nodes, minimum, pools, false)
      const fast = runPrune(nodes, minimum, pools, true)
      expect(fast.ids).toEqual(general.ids)
      expect(fast.nodes).toBe(general.nodes)
      expect(fast.minimum).toEqual(general.minimum)
    })
  }

  it('still removes candidates the constraints can never satisfy', () => {
    // A single slot, so a candidate's ceiling is exactly its own c0 + c1.
    const single = [
      [
        { id: 1, c0: 0, c1: 3 },
        { id: 2, c0: 6, c1: 2 },
        { id: 3, c0: 10, c1: 1 },
        { id: 4, c1: 7 },
      ],
    ]
    const nodes = [sum(r0, r1), sum(r0, r1, 0)]
    const minimum = [-Infinity, 8]
    expect(runPrune(nodes, minimum, single, true).ids[0]).toEqual(['2', '3'])
  })

  it('drops no candidates when the constraints are trivially satisfiable', () => {
    // The required minimum sits below every achievable value, so `pruneRange`
    // discards the constraint instead of filtering against it.
    const nodes = [sum(r0, r1), sum(r0, r1, -1000)]
    const minimum = [-Infinity, -100000]
    expect(runPrune(nodes, minimum, pools, true).ids).toEqual(
      pools.map((c) => c.map((x) => String(x.id)).sort())
    )
  })

  it('keeps every candidate when only the objective is constrained', () => {
    const nodes = [sum(r0, r1), sum(r0, r1)]
    const minimum = [-Infinity, -Infinity]
    expect(runPrune(nodes, minimum, pools, true).ids).toEqual(
      pools.map((c) => c.map((x) => String(x.id)).sort())
    )
  })
})
