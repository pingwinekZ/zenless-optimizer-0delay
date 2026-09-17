import type { DiscSlotKey, DiscSubStatKey } from '../../consts'
import type { ICachedDisc } from '../../db'
import {
  computeDynamicScoresWithReplacement,
  type ReplacementEvaluator,
  type RollContext,
} from './replacementScores'

const slots: Record<string, DiscSlotKey> = {
  a1: '1',
  b1: '2',
  t1: '1',
  t2: '2',
}
const subsById: Record<string, Partial<Record<DiscSubStatKey, number>>> = {
  // User's scenario: one premium roll short of perfect (CD 4 vs 5),
  // extra filler roll in HP% (2 vs 1, HP% not effective here).
  a1: { crit_: 2, crit_dmg_: 4, hp_: 2 },
  t1: { crit_: 2, crit_dmg_: 5, hp_: 1 },
  b1: { crit_: 1, crit_dmg_: 2 },
  t2: { crit_: 2, crit_dmg_: 4 },
}
const getDisc = (id: string) => {
  const subs = subsById[id]
  if (!subs || !slots[id]) return undefined
  return {
    id,
    slotKey: slots[id],
    substats: Object.entries(subs).map(([key, upgrades]) => ({
      key,
      upgrades,
    })),
  } as unknown as ICachedDisc
}

const rollContext: RollContext = {
  effectiveStats: ['crit_', 'crit_dmg_'],
  weights: { crit_: 1, crit_dmg_: 1 },
}

function stubEvaluator(values: Map<string, number>): ReplacementEvaluator {
  return (discs) => {
    const key = (Object.values(discs) as (ICachedDisc | undefined)[])
      .filter(Boolean)
      .map((d) => (d as ICachedDisc).id)
      .sort()
      .join('+')
    return values.get(key)
  }
}

function theoDiscs() {
  return {
    1: getDisc('t1'),
    2: getDisc('t2'),
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
  }
}

describe('computeDynamicScoresWithReplacement', () => {
  it('scores one-premium-roll-short below 1 even when damage is neutral', async () => {
    // Plug-in says a1 is damage-neutral (1000/1000), but roll counting
    // sees 6 premium rolls vs perfect 7 → 6/7 ≈ 0.857 governs.
    const values = new Map<string, number>([
      ['a1+t2', 1000],
      ['b1+t1', 800],
      ['t1+t2', 1000],
    ])
    const { entries, completed } = await computeDynamicScoresWithReplacement(
      [{ value: 904, discIds: { 1: 'a1', 2: 'b1' } as any }],
      1000,
      theoDiscs() as any,
      undefined,
      getDisc,
      stubEvaluator(values),
      rollContext
    )
    expect(completed).toBe(true)
    expect(entries['a1'].score).toBeCloseTo(6 / 7)
    expect(entries['a1'].rollRatio).toBeCloseTo(6 / 7)
    expect(entries['a1'].plugValue).toBeCloseTo(1000)
    // b1: rolls 3/6 = 0.5, plug 800/1000 = 0.8 → roll lens governs too
    expect(entries['b1'].score).toBeCloseTo(0.5)
    // Build-ratio info is still tracked
    expect(entries['a1'].baseRatio).toBeCloseTo(0.904)
  })

  it('lets the damage lens govern on main/set mismatch', async () => {
    // a1 has MORE premium rolls than perfect (8/7 → clamped 1) but breaks
    // the perfect setup when plugged in (700/1000) → damage governs.
    const richSubs: Record<string, Partial<Record<DiscSubStatKey, number>>> = {
      ...subsById,
      a1: { crit_: 3, crit_dmg_: 5 },
    }
    const richGetDisc = (id: string) => {
      const subs = richSubs[id]
      if (!subs || !slots[id]) return undefined
      return {
        id,
        slotKey: slots[id],
        substats: Object.entries(subs).map(([key, upgrades]) => ({
          key,
          upgrades,
        })),
      } as unknown as ICachedDisc
    }
    const values = new Map<string, number>([
      ['a1+t2', 700],
      ['b1+t1', 800],
      ['t1+t2', 1000],
    ])
    const { entries } = await computeDynamicScoresWithReplacement(
      [{ value: 904, discIds: { 1: 'a1', 2: 'b1' } as any }],
      1000,
      {
        1: richGetDisc('t1'),
        2: richGetDisc('t2'),
        3: undefined,
        4: undefined,
        5: undefined,
        6: undefined,
      } as any,
      undefined,
      richGetDisc,
      stubEvaluator(values),
      rollContext
    )
    expect(entries['a1'].score).toBeCloseTo(0.7)
  })

  it('falls back to the build ratio when neither lens evaluates', async () => {
    const values = new Map<string, number>([['t1+t2', 1000]])
    const { entries } = await computeDynamicScoresWithReplacement(
      [{ value: 904, discIds: { 1: 'a1', 2: 'b1' } as any }],
      1000,
      theoDiscs() as any,
      undefined,
      getDisc,
      stubEvaluator(values)
    )
    expect(entries['a1'].score).toBeCloseTo(0.904)
    expect(entries['a1'].plugValue).toBeUndefined()
    expect(entries['a1'].rollRatio).toBeUndefined()
  })

  it('uses ratio-only scoring without theoretical discs', async () => {
    let evals = 0
    const { entries, completed } = await computeDynamicScoresWithReplacement(
      [{ value: 904, discIds: { 1: 'a1', 2: 'b1' } as any }],
      1000,
      undefined,
      undefined,
      getDisc,
      () => {
        evals += 1
        return 0
      },
      rollContext
    )
    expect(completed).toBe(true)
    expect(evals).toBe(0)
    expect(entries['a1'].score).toBeCloseTo(0.904)
  })

  it('reports incomplete when cancelled', async () => {
    const values = new Map<string, number>([['t1+t2', 1000]])
    const { completed } = await computeDynamicScoresWithReplacement(
      [{ value: 904, discIds: { 1: 'a1', 2: 'b1' } as any }],
      1000,
      theoDiscs() as any,
      undefined,
      getDisc,
      stubEvaluator(values),
      rollContext,
      { isCancelled: () => true }
    )
    expect(completed).toBe(false)
  })
})
