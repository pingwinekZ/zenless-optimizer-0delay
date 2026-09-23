import {
  type allDiscSubStatKeys,
  getDiscSubStatBaseVal,
} from '@zenless-optimizer/zzz/consts'
import { describe, expect, it } from 'vitest'
import {
  generateTheoreticalDiscs,
  RECIPE_DESCRIPTOR_STRIDE,
} from './generateTheoreticalDiscs'

/**
 * Regression guards for the theoretical-max recipe space.
 *
 * These pin the exact recipe counts (the space must not silently shrink or
 * grow — shrinking would drop real builds, growing would blow up memory) and
 * the structural invariants that the compact descriptor index has to preserve
 * when it rebuilds a recipe's metadata on demand.
 */

/** Substats that can also appear as a main stat for these configurations. */
const MAIN_STAT_COLLIDING_KEYS = new Set(['hp', 'atk', 'def', 'hp_'])

describe('generateTheoreticalDiscs', () => {
  it('generates the exact recipe count for a narrow plan (Zhao)', () => {
    const { recipes, stats } = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    expect(stats.recipeCount).toBe(36605)
    expect(recipes.length).toBe(36605)
    expect(stats.mainStatComboCount).toBe(1)
    expect(stats.substatComboCount).toBe(25)
  })

  it('generates the exact recipe count for a filtered plan (Promeia)', () => {
    const { recipes, stats } = generateTheoreticalDiscs(
      'Promeia',
      ['PhaethonsMelody'],
      ['NotesFromTheChained'],
      { 4: ['anomProf'], 5: ['ice_dmg_'], 6: ['anomMas_'] }
    )
    expect(stats.recipeCount).toBe(40410)
    expect(recipes.length).toBe(40410)
    expect(stats.mainStatComboCount).toBe(1)
  })

  it('keeps the descriptor index in step with the recipe list', () => {
    const { recipes, recipeIndex, stats } = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    expect(recipeIndex).toBeInstanceOf(Uint16Array)
    expect(recipeIndex.length).toBe(recipes.length * RECIPE_DESCRIPTOR_STRIDE)
    // The compact index must be far smaller than the recipes it describes.
    expect(recipeIndex.byteLength).toBeLessThan(recipes.length * 16)
    expect(stats.recipeCount).toBe(recipes.length)
  })

  it('round-trips every recipe through materializeRecipe', () => {
    const { recipes, materializeRecipe } = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    for (let i = 0; i < recipes.length; i += 37) {
      const recipe = materializeRecipe(i)
      expect(recipe).toBeDefined()
      expect(recipe!.id).toBe(`recipe_${i}`)
      expect(recipe!.id).toBe(recipes[i].id)
    }
    expect(materializeRecipe(-1)).toBeUndefined()
    expect(materializeRecipe(recipes.length)).toBeUndefined()
  })

  it('gives every recipe the full 54 substat rolls', () => {
    const { recipes, materializeRecipe } = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    for (let i = 0; i < recipes.length; i++) {
      const recipe = materializeRecipe(i)!
      const rolls = Object.values(recipe.totalRolls).reduce((a, b) => a + b, 0)
      expect(rolls).toBe(54)
      // Six discs, each with four substat slots.
      const slots = recipe.perDiscSubstats.reduce((a, d) => a + d.length, 0)
      expect(slots).toBe(24)
    }
  })

  it('agrees with the recipe metadata it rebuilds on demand', () => {
    const { recipes, materializeRecipe } = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    for (let i = 0; i < recipes.length; i += 11) {
      const recipe = materializeRecipe(i)!
      const candidate = recipes[i] as Record<string, any>
      for (const [key, rolls] of Object.entries(recipe.totalRolls)) {
        // Keys that are also a main stat carry that contribution too, and the
        // aggregate is what the solver sees.
        if (MAIN_STAT_COLLIDING_KEYS.has(key)) continue
        expect(candidate[key]).toBeCloseTo(
          getDiscSubStatBaseVal(
            key as (typeof allDiscSubStatKeys)[number],
            'S'
          ) * (rolls as number),
          10
        )
      }
      // Set counters must match the requested set assignment.
      expect(candidate[recipe.set4]).toBe(recipe.set4 === recipe.set2 ? 6 : 4)
      if (recipe.set4 !== recipe.set2) expect(candidate[recipe.set2]).toBe(2)
    }
  })

  it('supports widening the combo filter without changing the defaults', () => {
    const strict = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland']
    )
    const wide = generateTheoreticalDiscs(
      'Zhao',
      ['MoonlightLullaby'],
      ['BunnyInWonderland'],
      undefined,
      undefined,
      { minEffectivePerCombo: 2, applyDominanceFilter: false }
    )
    expect(wide.stats.substatComboCount).toBeGreaterThan(
      strict.stats.substatComboCount
    )
    expect(wide.stats.recipeCount).toBeGreaterThan(strict.stats.recipeCount)
    // The defaults must still reproduce the historical space exactly.
    expect(strict.stats.recipeCount).toBe(36605)
  })

  it('honours substat roll targets', () => {
    const { recipes, materializeRecipe, stats } = generateTheoreticalDiscs(
      'Promeia',
      ['PhaethonsMelody'],
      ['NotesFromTheChained'],
      { 4: ['anomProf'], 5: ['ice_dmg_'], 6: ['anomMas_'] },
      { atk_: 23 }
    )
    expect(stats.substatComboCount).toBe(1)
    expect(recipes.length).toBeGreaterThan(0)
    for (let i = 0; i < recipes.length; i += 5) {
      expect(materializeRecipe(i)!.totalRolls.atk_).toBe(23)
    }
  })

  it('produces recipes for every 2p set when multiple are selected', () => {
    // Single 2p set — baseline count
    const single = generateTheoreticalDiscs(
      'Promeia',
      ['PhaethonsMelody'],
      ['NotesFromTheChained'],
      { 4: ['anomProf'], 5: ['ice_dmg_'], 6: ['anomMas_'] }
    )
    // Two 2p sets — recipe count should approximately double
    const multi = generateTheoreticalDiscs(
      'Promeia',
      ['PhaethonsMelody', 'WoodpeckerElectro'],
      ['NotesFromTheChained'],
      { 4: ['anomProf'], 5: ['ice_dmg_'], 6: ['anomMas_'] }
    )
    expect(multi.stats.recipeCount).toBe(single.stats.recipeCount * 2)
    expect(multi.recipes.length).toBe(single.recipes.length * 2)

    // Recipes are interleaved: for each (main, sub, roll) combo, one recipe
    // per 2p set. Consecutive recipes with the same index mod 2 share the
    // same set assignment.
    for (let i = 0; i < multi.recipes.length; i++) {
      const meta = multi.materializeRecipe(i)
      expect(meta).toBeDefined()
      const expected = i % 2 === 0 ? 'PhaethonsMelody' : 'WoodpeckerElectro'
      expect(meta!.set2).toBe(expected)
    }
  })
})
