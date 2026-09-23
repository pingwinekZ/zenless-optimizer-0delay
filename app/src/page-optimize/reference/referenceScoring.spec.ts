import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import { buildReferenceProfile, compareToReference } from './referenceScoring'

function recipe(
  totalRolls: Record<string, number>,
  mainStats: Record<string, string>,
  set4 = 'SetA',
  set2 = 'SetB'
): BuildRecipe {
  return {
    id: 'recipe_0',
    mainStats: mainStats as any,
    totalRolls: totalRolls as any,
    appearances: {},
    perDiscSubstats: [],
    set4: set4 as any,
    set2: set2 as any,
  }
}

describe('buildReferenceProfile', () => {
  it('copies exact rolls and mains from the pinned recipe', () => {
    const profile = buildReferenceProfile(
      recipe({ crit_: 10, crit_dmg_: 5 }, { 1: 'hp', 4: 'crit_' })
    )
    expect(profile.perfectRolls['crit_']).toBe(10)
    expect(profile.perfectRolls['crit_dmg_']).toBe(5)
    expect(profile.mainsBySlot['4']).toBe('crit_')
    expect(profile.mainsBySlot['1']).toBe('hp')
  })
})

describe('compareToReference', () => {
  const profile = buildReferenceProfile(
    recipe({ crit_: 10, crit_dmg_: 5 }, { 4: 'crit_' })
  )
  const weights = { crit_: 1, crit_dmg_: 1 } as any

  it('yields no tips when local matches perfect', () => {
    const { tips } = compareToReference(
      { crit_: 10, crit_dmg_: 5 },
      { 4: 'crit_' },
      profile,
      weights
    )
    expect(tips).toEqual([])
  })

  it('reports exact deficits vs the pinned build', () => {
    const { tips } = compareToReference(
      { crit_: 7, crit_dmg_: 5 },
      { 4: 'crit_' },
      profile,
      weights
    )
    expect(tips.map((t) => [t.key, t.deficit])).toEqual([['crit_', 3]])
  })

  it('flags a main that differs from perfect', () => {
    const { mainMismatches } = compareToReference(
      { crit_: 10, crit_dmg_: 5 },
      { 4: 'atk_' },
      profile,
      weights
    )
    expect(mainMismatches).toEqual([
      { slot: '4', localMain: 'atk_', perfectMain: 'crit_' },
    ])
    const ok = compareToReference(
      { crit_: 10, crit_dmg_: 5 },
      { 4: 'crit_' },
      profile,
      weights
    )
    expect(ok.mainMismatches).toEqual([])
  })
})
