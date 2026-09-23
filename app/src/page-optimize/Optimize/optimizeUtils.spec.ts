import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import { createRecipeDiscs, recipeIndexFromId } from './optimizeUtils'

const recipe: BuildRecipe = {
  id: 'recipe_7',
  mainStats: {
    '1': 'hp',
    '2': 'atk',
    '3': 'def',
    '4': 'crit_',
    '5': 'atk_',
    '6': 'anomProf',
  },
  totalRolls: { crit_dmg_: 5 },
  appearances: { crit_dmg_: 3 },
  perDiscSubstats: [[{ key: 'crit_dmg_', upgrades: 2 }], [], [], [], [], []],
  set4: 'PufferElectro',
  set2: 'SwingJazz',
}

describe('recipeIndexFromId', () => {
  it('parses recipe ids', () => {
    expect(recipeIndexFromId('recipe_7')).toBe(7)
    expect(recipeIndexFromId('recipe_0')).toBe(0)
  })
  it('rejects non-recipe ids', () => {
    expect(recipeIndexFromId('disc_7')).toBeUndefined()
    expect(recipeIndexFromId('recipe_x')).toBeUndefined()
    expect(recipeIndexFromId('')).toBeUndefined()
  })
})

describe('createRecipeDiscs', () => {
  it('builds one S-rank disc per slot with set assignment', () => {
    const discs = createRecipeDiscs(recipe, 'recipe_7')
    expect(discs).toHaveLength(6)
    expect(discs.map((d) => d.id)).toEqual([
      'recipe_7_1',
      'recipe_7_2',
      'recipe_7_3',
      'recipe_7_4',
      'recipe_7_5',
      'recipe_7_6',
    ])
    for (const d of discs) {
      expect(d.rarity).toBe('S')
      expect(d.level).toBe(15)
    }
    // Slots 1-4 carry the 4pc set, 5-6 the 2pc set
    expect(discs.slice(0, 4).map((d) => d.setKey)).toEqual([
      'PufferElectro',
      'PufferElectro',
      'PufferElectro',
      'PufferElectro',
    ])
    expect(discs.slice(4).map((d) => d.setKey)).toEqual([
      'SwingJazz',
      'SwingJazz',
    ])
    expect(discs[0].mainStatKey).toBe('hp')
    expect(discs[0].substats).toEqual([{ key: 'crit_dmg_', upgrades: 2 }])
    expect(discs[1].substats).toEqual([])
  })
})
