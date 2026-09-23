import type { BuildRecipe, GeneratedBuild } from '@zenless-optimizer/zzz/db'
import { buildRowId } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { resolvePinTarget } from './useTheoreticalReference'

const build = (disc1?: string, value = 0): GeneratedBuild =>
  ({ discIds: { '1': disc1 }, value }) as unknown as GeneratedBuild

const recipe = (id: string): BuildRecipe =>
  ({
    id,
    set4: 'ChaoticMetal',
    set2: 'WoodpeckerElectro',
  }) as unknown as BuildRecipe

const resolveRecipe = (id: string) =>
  id === 'recipe_3' ? recipe('recipe_3') : undefined

/** Mirrors the hook's value resolution: enriched-first, then stored value. */
const resolveValue =
  (enriched: Record<string, number>) => (b: GeneratedBuild) =>
    enriched[buildRowId(b)] ?? b.value

describe('resolvePinTarget', () => {
  it('rejects non-recipe builds without consulting the resolver', () => {
    let consulted = 0
    const result = resolvePinTarget({
      toPin: build('plain_1', 500),
      resolveRecipe: (id) => {
        consulted++
        return resolveRecipe(id)
      },
      resolveValue: resolveValue({}),
    })
    expect(result).toEqual({ ok: false, reason: 'nothing to pin' })
    expect(consulted).toBe(0)
  })

  it('rejects a missing build', () => {
    expect(
      resolvePinTarget({
        toPin: undefined,
        resolveRecipe,
        resolveValue: resolveValue({}),
      })
    ).toEqual({ ok: false, reason: 'nothing to pin' })
  })

  it('rejects builds whose recipe metadata cannot be resolved', () => {
    expect(
      resolvePinTarget({
        toPin: build('recipe_9_1', 500),
        resolveRecipe,
        resolveValue: resolveValue({}),
      })
    ).toEqual({ ok: false, reason: 'could not resolve theoretical recipe' })
  })

  it('rejects recipe builds that resolve to a non-positive value', () => {
    expect(
      resolvePinTarget({
        toPin: build('recipe_3_1', 0),
        resolveRecipe,
        resolveValue: resolveValue({}),
      })
    ).toEqual({ ok: false, reason: 'nothing to pin' })
  })

  it('resolves the recipe and the enriched value for a pinnable build', () => {
    const selected = build('recipe_3_1', 999)
    const result = resolvePinTarget({
      toPin: selected,
      resolveRecipe,
      resolveValue: resolveValue({ [buildRowId(selected)]: 1234.5 }),
    })
    expect(result).toEqual({
      ok: true,
      recipe: recipe('recipe_3'),
      value: 1234.5,
    })
  })

  it('falls back to the stored value when the build is not enriched', () => {
    const result = resolvePinTarget({
      toPin: build('recipe_3_1', 777),
      resolveRecipe,
      resolveValue: resolveValue({}),
    })
    expect(result).toEqual({ ok: true, recipe: recipe('recipe_3'), value: 777 })
  })
})
