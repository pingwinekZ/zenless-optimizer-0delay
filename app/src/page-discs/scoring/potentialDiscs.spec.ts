import type { DiscSubStatKey } from '@zenless-optimizer/zzz/consts'
import type { ICachedDisc } from '@zenless-optimizer/zzz/db'
import {
  boostDiscToPotential,
  materializeBoostedSubstats,
  planPotentialRolls,
} from './potentialDiscs'

const disc = (over: Record<string, unknown>) =>
  ({
    id: 'd1',
    setKey: 'SwingJazz',
    slotKey: '1',
    level: 0,
    rarity: 'S',
    mainStatKey: 'hp',
    substats: [],
    location: '',
    lock: false,
    trash: false,
    ...over,
  }) as unknown as ICachedDisc

const weights: Partial<Record<DiscSubStatKey, number>> = {
  crit_: 1.5,
  crit_dmg_: 1.4,
  atk_: 1.2,
}
const effective: DiscSubStatKey[] = ['crit_', 'crit_dmg_', 'atk_']

describe('planPotentialRolls', () => {
  it('fills remaining upgrades into the highest-weight stat first', () => {
    const d = disc({
      substats: [
        { key: 'crit_', upgrades: 1 },
        { key: 'atk_', upgrades: 1 },
      ],
    })
    // S rank level 0 -> budget of 5; crit_ has headroom 4, then next best
    const rolls = planPotentialRolls(d, effective, weights)
    expect(rolls).toHaveLength(5)
    expect(rolls.slice(0, 4)).toEqual(['crit_', 'crit_', 'crit_', 'crit_'])
    expect(rolls[4]).toEqual('crit_dmg_')
  })
  it('returns no rolls for a max-level disc', () => {
    const d = disc({
      level: 15,
      substats: [{ key: 'crit_', upgrades: 5 }],
    })
    expect(planPotentialRolls(d, effective, weights)).toEqual([])
  })
})

describe('materializeBoostedSubstats', () => {
  it('applies rolls to existing substats and opens new slots', () => {
    const d = disc({
      substats: [{ key: 'atk_', upgrades: 1 }],
    })
    const out = materializeBoostedSubstats(d, ['crit_', 'crit_', 'crit_dmg_'])
    expect(out).toHaveLength(3)
    expect(out.find((s) => s.key === 'crit_')?.upgrades).toEqual(2)
    expect(out.find((s) => s.key === 'crit_dmg_')?.upgrades).toEqual(1)
  })
})

describe('boostDiscToPotential', () => {
  it('bumps level to max and preserves identity fields', () => {
    const d = disc({
      id: 'real-id',
      slotKey: '4',
      mainStatKey: 'crit_',
      level: 9,
      location: 'Anby',
      substats: [
        { key: 'crit_dmg_', upgrades: 2 },
        { key: 'atk_', upgrades: 1 },
      ],
    })
    // level 9 -> budget floor(15/3) - floor(9/3) = 2
    const boosted = boostDiscToPotential(d, effective, weights)
    expect(boosted.id).toEqual('real-id')
    expect(boosted.slotKey).toEqual('4')
    expect(boosted.mainStatKey).toEqual('crit_')
    expect(boosted.location).toEqual('Anby')
    expect(boosted.level).toEqual(15)
    const total = boosted.substats.reduce((s, sub) => s + sub.upgrades, 0)
    expect(total).toEqual(5)
  })
  it('returns the same disc when already at max potential', () => {
    const d = disc({
      level: 15,
      substats: [{ key: 'crit_', upgrades: 5 }],
    })
    expect(boostDiscToPotential(d, effective, weights)).toBe(d)
  })
})
