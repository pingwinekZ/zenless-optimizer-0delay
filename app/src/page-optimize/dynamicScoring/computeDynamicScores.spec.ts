import type { DiscSlotKey } from '../../consts'
import { computeDynamicDiscScores } from './computeDynamicScores'

function slotOf(map: Record<string, DiscSlotKey>) {
  return (id: string) => map[id]
}

describe('computeDynamicDiscScores', () => {
  it('scores each disc as % of the theoretical best', () => {
    const slots: Record<string, DiscSlotKey> = {
      a1: '1',
      a2: '1',
      b1: '2',
    }
    const { entries, localBest, ratio } = computeDynamicDiscScores(
      [
        { value: 800, discIds: { 1: 'a1', 2: 'b1' } as any },
        { value: 1000, discIds: { 1: 'a2', 2: 'b1' } as any },
      ],
      2000,
      slotOf(slots)
    )
    expect(localBest).toBe(1000)
    expect(ratio).toBeCloseTo(0.5)
    // Raw ratios
    expect(entries['a1'].baseRatio).toBeCloseTo(0.4)
    expect(entries['a2'].baseRatio).toBeCloseTo(0.5)
    expect(entries['b1'].baseRatio).toBeCloseTo(0.5)
    // Score is % of theoretical best — local best discs show the gap to
    // perfect instead of being renormalized to 1.0
    expect(entries['a2'].score).toBeCloseTo(0.5)
    expect(entries['a1'].score).toBeCloseTo(0.4)
    expect(entries['b1'].score).toBeCloseTo(0.5)
  })

  it('returns no entries when theoBest is not positive', () => {
    const { entries, ratio } = computeDynamicDiscScores(
      [{ value: 100, discIds: { 1: 'a1' } as any }],
      0,
      slotOf({ a1: '1' })
    )
    expect(entries).toEqual({})
    expect(ratio).toBe(0)
  })

  it('skips discs with unknown slots', () => {
    const { entries } = computeDynamicDiscScores(
      [{ value: 100, discIds: { 1: 'unknown' } as any }],
      200,
      slotOf({})
    )
    expect(entries).toEqual({})
  })
})
