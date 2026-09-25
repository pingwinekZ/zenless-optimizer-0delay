import type { BuildRecipe, ICachedDisc } from '@zenless-optimizer/zzz/db'
import { useRef, useState } from 'react'

/**
 * Theoretical-max disc cache + recipe metadata resolver + display-canonical
 * values. Pure state-ownership move from `Optimize/index.tsx` — one object
 * for the future `useSolverRun` hook instead of four separate refs.
 */
export function useTheoreticalDiscStore() {
  // Theoretical max disc cache — maps fake disc IDs to ICachedDisc for stat computation
  // Uses a ref for synchronous access (avoids race with batchComputeBuildStats)
  // and React state for triggering re-renders
  const theoreticalDiscMapRef = useRef<Record<string, ICachedDisc>>({})
  // Display-canonical build values (buildRowId -> recomputed target value).
  // The solver's raw values can differ by float rounding from what the
  // Analysis panel recomputes, so pinning reads from here when available —
  // otherwise the reference would show a 1-point gap vs itself.
  const enrichedValuesRef = useRef<Map<string, number>>(new Map())
  const [theoreticalDiscMap, setTheoreticalDiscMap] = useState<
    Record<string, ICachedDisc>
  >({})
  // Recipe metadata resolved from the live solver pipeline — rebuilt on every
  // theoretical run and gone again the moment the page unmounts.
  const runRecipeMetaRef = useRef<
    (recipeId: string) => BuildRecipe | undefined
  >(() => undefined)
  // Recipe metadata persisted with the current result set (see the hydration
  // effect in `Optimize/index.tsx`). Consulted first by the composed resolver
  // below: while rows of an older run are still on screen, only the persisted
  // copy describes them correctly — a newer run's pipeline would resolve the
  // same `recipe_<n>` ids to different recipes.
  const persistedRecipesRef = useRef<Record<string, BuildRecipe>>({})
  // Identity (`optConfigId:buildDate`) of the result set whose recipe discs
  // are currently in the map. Bumped by completed runs and compared by the
  // hydration effect in `Optimize/index.tsx` — a change means the map's
  // `recipe_*` layer belongs to another result set (page/character switch)
  // and must be rebuilt, since recipe ids are only unique within a run.
  const discMapIdentityRef = useRef('')
  // Stable composed resolver handed to display/pinning. Stable identity
  // matters: consumers capture `recipeMetaRef.current` at render time.
  const recipeMetaRef = useRef<(recipeId: string) => BuildRecipe | undefined>(
    (recipeId) =>
      persistedRecipesRef.current[recipeId] ??
      runRecipeMetaRef.current(recipeId)
  )
  // Recipe metadata for TheoreticalBuildSummary display. This is a resolver,
  // not a map: the recipe space can run to millions of entries, so metadata is
  // rebuilt on demand from the generator's compact descriptor index for the
  // handful of recipes that actually surface (the solver's top-N and the
  // selected row). Retaining a BuildRecipe for every recipe used to be the
  // single largest allocation in the whole pipeline.
  return {
    theoreticalDiscMapRef,
    enrichedValuesRef,
    theoreticalDiscMap,
    setTheoreticalDiscMap,
    runRecipeMetaRef,
    persistedRecipesRef,
    discMapIdentityRef,
    recipeMetaRef,
  }
}
