import { zodTypedRecord } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import { z } from 'zod'
import type { DiscIds, ZzzDatabase } from '../..'
import type { BuildRecipe } from '../../Interfaces/BuildRecipe'
import { DataManager } from '../DataManager'
import { validateRecipe } from './TheoReferenceDataManager'

const discIdValueSchema = z.union([z.string(), z.undefined()])
// JSON drops undefined values, so stored discIds may omit empty slots.
// Fill them before validation, otherwise entries with empty slots vanish.
const discIdsSchema = z.preprocess(
  (v) => ({
    ...objKeyMap(allDiscSlotKeys, () => undefined),
    ...((v ?? {}) as Record<string, string | undefined>),
  }),
  zodTypedRecord(allDiscSlotKeys, discIdValueSchema)
) as z.ZodType<DiscIds>

const generatedBuildSchema = z.object({
  value: z.number(),
  wengineKey: z.string().optional(),
  discIds: discIdsSchema,
})

export type GeneratedBuild = z.infer<typeof generatedBuildSchema>

const generatedBuildListSchema = z.object({
  builds: z.array(generatedBuildSchema).catch([]),
  buildDate: z.number().int().catch(0),
  // Theoretical runs: recipe metadata for the returned rows, keyed by
  // recipe id. The `recipe_*` disc ids in `builds` survive a reload, but
  // nothing can turn them back into discs without these recipes — they are
  // the only handle on the (otherwise in-memory) recipe space. Each entry
  // is validated individually in `validate`.
  recipes: z
    .custom<Record<string, BuildRecipe>>(
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    )
    .optional()
    .catch(undefined),
})

export type GeneratedBuildList = z.infer<typeof generatedBuildListSchema>

/**
 * How many generated builds are kept in storage per optimizer result set.
 *
 * The solver can return up to `maxBuildsToShow` rows (as many as 50000), and
 * the whole list is regenerable by re-running the optimizer, so persisting all
 * of them - for every character - is one of the fastest ways to exhaust the
 * 5MB localStorage budget. The full list stays in memory and in exports; only
 * the stored copy is capped, so a reload restores the top rows of the last
 * run instead of all of it.
 */
export const maxPersistedGeneratedBuilds = 100

export class GeneratedBuildListDataManager extends DataManager<
  string,
  'generatedBuildList',
  GeneratedBuildList,
  GeneratedBuildList
> {
  constructor(database: ZzzDatabase) {
    super(database, 'generatedBuildList')
  }
  override validate(obj: unknown): GeneratedBuildList | undefined {
    const result = generatedBuildListSchema.safeParse(obj)
    if (!result.success) return undefined

    const { builds: rawBuilds, buildDate, recipes: rawRecipes } = result.data

    // Validate builds with database lookups
    const builds: GeneratedBuild[] = rawBuilds.map((build) => {
      const { discIds: discIdsRaw, value } = build
      let { wengineKey } = build

      // Validate wengineKey is a valid key
      if (wengineKey && !this.database.wengines.get(wengineKey))
        wengineKey = undefined

      // Validate discIds - ensure each disc exists and matches its slot
      // Synthetic theoretical discs (prefixed with 'theoretical_') bypass the
      // database lookup since they exist only in React state.
      const discIds = objKeyMap(allDiscSlotKeys, (slotKey) => {
        const id = discIdsRaw[slotKey]
        if (!id) return undefined
        if (id.startsWith('theoretical_') || id.startsWith('recipe_')) return id
        return this.database.discs.get(id)?.slotKey === slotKey ? id : undefined
      })

      return { discIds, wengineKey, value }
    })

    const recipes = validateRecipes(rawRecipes)
    return {
      builds,
      buildDate,
      ...(recipes ? { recipes } : {}),
    }
  }
  override saveStorageEntry(key: string, cached: GeneratedBuildList): void {
    const capped: GeneratedBuildList =
      cached.builds.length > maxPersistedGeneratedBuilds
        ? {
            ...cached,
            builds: cached.builds.slice(0, maxPersistedGeneratedBuilds),
          }
        : cached
    if (!capped.recipes) {
      super.saveStorageEntry(key, capped)
      return
    }
    // Recipes only need to cover the rows that survive the cap: the full
    // list stays in memory (and so does the in-session recipe resolver),
    // while storage restores just the top rows of the last run.
    const recipes = recipesForBuilds(capped.recipes, capped.builds)
    super.saveStorageEntry(
      key,
      recipes
        ? { ...capped, recipes }
        : { builds: capped.builds, buildDate: capped.buildDate }
    )
  }

  new(data: GeneratedBuildList) {
    const id = this.generateKey()
    this.set(id, { ...data })
    return id
  }
}

/** Keep only recipes that pass validation; drop the field when none do. */
function validateRecipes(
  raw: Record<string, BuildRecipe> | undefined
): Record<string, BuildRecipe> | undefined {
  if (!raw) return undefined
  const out: Record<string, BuildRecipe> = {}
  for (const [recipeId, recipe] of Object.entries(raw)) {
    const valid = validateRecipe(recipe)
    if (valid) out[recipeId] = valid
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/** Recipe metadata subset referenced by the given rows (`recipe_3_1` -> `recipe_3`). */
function recipesForBuilds(
  recipes: Record<string, BuildRecipe>,
  builds: GeneratedBuild[]
): Record<string, BuildRecipe> | undefined {
  const out: Record<string, BuildRecipe> = {}
  for (const build of builds) {
    const slot1 = build.discIds['1']
    if (!slot1?.startsWith('recipe_')) continue
    const recipeId = slot1.replace(/_\d+$/, '')
    const recipe = recipes[recipeId]
    if (recipe) out[recipeId] = recipe
  }
  return Object.keys(out).length > 0 ? out : undefined
}
