import { cmpEq, max, type NumTagFree, prod, read, sum } from '../node'
import { ArrayMap } from '../util'
import { type Candidate, pruneBottom, State } from './prune'

/**
 * `pruneBottom` was rewritten to drop its per-candidate records (one `Val`
 * object with an `inc` record and an `incomp` array for every candidate) and
 * to compare through contiguous doubles instead of string-keyed lookups. The
 * rewrite must be behaviourally identical: this file pins it against a literal
 * reference implementation of the previous algorithm.
 */

type Monotonicity = { inc: boolean; dec: boolean }

/** The algorithm as originally written, kept verbatim as a reference. */
function referencePruneBottom(
  candidateSlots: Candidate<number>[][],
  monotonicities: [string, Monotonicity][],
  topN: number
): Candidate<number>[][] {
  type Val = {
    incomp: number[]
    inc: Record<string, number>
    c: Candidate<number>
  }
  const vals = candidateSlots.map((comp) =>
    comp.map((c) => {
      const out: Val = { incomp: [], inc: {}, c }
      for (const [cat, m] of monotonicities)
        if (m.inc) out.inc[cat] = c[cat] ?? 0
        else if (m.dec) out.inc[cat] = -(c[cat] ?? 0)
        else out.incomp.push(c[cat] ?? 0)
      return out
    })
  )
  const sample = vals[0][0]
  if (sample === undefined) return candidateSlots
  const cats = Object.keys(sample.inc)
  const revCats = [...cats].reverse()
  const hasIncomp = !!sample.incomp.length

  const candidates = vals.map((vals) => {
    const groups = new ArrayMap<number, Val[]>()
    if (hasIncomp) {
      vals.forEach((val) => {
        const ref = groups.ref(val.incomp)
        if (ref.value) ref.value.push(val)
        else ref.value = [val]
      })
    } else groups.ref([]).value = vals

    return [...groups.values()].flatMap((vals) => {
      vals.sort(({ inc: a }, { inc: b }) => {
        const cat = revCats.find((cat) => a[cat] !== b[cat])
        return cat === undefined ? 0 : b[cat] - a[cat]
      })
      return vals.filter(({ inc }, i) => {
        let betterCount = 0
        for (let j = 0, extra = i - topN; j <= extra + betterCount; j++) {
          const other = vals[j].inc
          if (cats.every((cat) => other[cat] >= inc[cat]))
            if (++betterCount >= topN) return false
        }
        return true
      })
    })
  })

  if (candidates.some((cnds, i) => cnds.length != candidateSlots[i].length))
    return candidates.map((cnds) => cnds.map((val) => val.c))
  return candidateSlots
}

const r0 = read({ q: 'c0' })
const r1 = read({ q: 'c1' })
const r2 = read({ q: 'c2' })

// `sum`, `max` and `prod(-1, ...)` produce increasing/decreasing coords, and
// `cmpEq` produces incomparable ones, so all three categorisations are covered.
const nodes = [
  sum(r0, r1, r2),
  r0,
  prod(-1, r1),
  max(r2, 3),
  cmpEq(r2, 3, r0, r1),
] as NumTagFree[]
const minimum = [-Infinity, 0, 0, 0, 0]

function makePool(rng: { next: () => number }): Record<string, number>[][] {
  const slots: Record<string, number>[][] = []
  for (let s = 0; s < 3; s++) {
    const slot: Record<string, number>[] = []
    const size = 5 + Math.floor(rng.next() * 40)
    for (let i = 0; i < size; i++) {
      const c: Record<string, number> = { id: s * 1000 + i }
      // Deliberately uneven key presence: absent keys must contribute 0.
      if (rng.next() > 0.15) c.c0 = Math.floor(rng.next() * 12)
      if (rng.next() > 0.15) c.c1 = Math.floor(rng.next() * 12)
      if (rng.next() > 0.15) c.c2 = Math.floor(rng.next() * 12)
      slot.push(c)
    }
    slots.push(slot)
  }
  return slots
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('pruneBottom', () => {
  for (const topN of [1, 3, 10, 100]) {
    it(`matches the reference implementation (topN=${topN})`, () => {
      for (let seed = 1; seed <= 12; seed++) {
        const rng = { next: mulberry32(seed) }
        const pool = makePool(rng)
        const state = new State(nodes, minimum, structuredClone(pool), 'q')
        const monotonicities = [...state.monotonicities]

        const expected = referencePruneBottom(
          structuredClone(pool) as Candidate<number>[][],
          monotonicities,
          topN
        )

        pruneBottom(state, topN)

        expect(state.candidates.map((slot) => slot.map((c) => c.id))).toEqual(
          expected.map((slot) => slot.map((c) => c.id))
        )
      }
    })
  }

  it('is a no-op when there is nothing to compare', () => {
    const state = new State(nodes, minimum, [[], []] as never, 'q')
    const before = state.candidates
    pruneBottom(state, 5)
    expect(state.candidates).toBe(before)
  })
})
