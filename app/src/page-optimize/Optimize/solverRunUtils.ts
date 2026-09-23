import type { DiscSlotKey, DiscSubStatKey } from '@zenless-optimizer/zzz/consts'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import type { TheoryPipelineOutput } from '@zenless-optimizer/zzz/solver'
import { materializeRecipeFromIndex } from '@zenless-optimizer/zzz/solver'
import { recipeIndexFromId } from './optimizeUtils'

/**
 * Debug override for theoretical-max verification: `localStorage`
 * `zz_debug_substat_targets` forces specific substat roll counts
 * (e.g. `{"atk_":23}`). Returns undefined when absent or unparseable.
 * Pure parse — the caller logs the warn so this stays side-effect free.
 */
export function readDebugSubstatTargets(
  storage: Pick<Storage, 'getItem'>
): Partial<Record<DiscSubStatKey, number>> | undefined {
  let raw: string | null = null
  try {
    raw = storage.getItem('zz_debug_substat_targets')
  } catch {
    return undefined
  }
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/**
 * Slice solver results to the user-requested count. The solver uses a larger
 * internal topN for pruning quality, so it may return more than requested.
 */
export function sliceResultsToLimit<T>(results: T[], limit: number): T[] {
  if (results.length > limit) return results.slice(0, limit)
  return results
}

/**
 * Sidebar permutation details for a theoretical run: the generated recipe
 * space is the search space, reported identically for every slot.
 */
export function buildTheoryPermutationDetails(
  totalRecipes: number
): Record<DiscSlotKey, { count: number; total: number }> {
  const details = {} as Record<DiscSlotKey, { count: number; total: number }>
  for (const slotKey of allDiscSlotKeys)
    details[slotKey] = { count: totalRecipes, total: totalRecipes }
  return details
}

/**
 * Resolver for recipe metadata from a theory pipeline output: the recipe
 * space can run to millions of entries, so metadata is rebuilt on demand
 * from the compact descriptor index instead of retaining every BuildRecipe.
 */
export function createRecipeMetaResolver(
  pipeline: Pick<TheoryPipelineOutput, 'recipeIndex' | 'context'>
): (recipeId: string) => BuildRecipe | undefined {
  return (recipeId: string) => {
    const index = recipeIndexFromId(recipeId)
    return index === undefined
      ? undefined
      : materializeRecipeFromIndex(
          index,
          pipeline.recipeIndex,
          pipeline.context
        )
  }
}
