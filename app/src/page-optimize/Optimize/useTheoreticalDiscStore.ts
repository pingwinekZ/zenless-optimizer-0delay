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
  // Recipe metadata for TheoreticalBuildSummary display. This is a resolver,
  // not a map: the recipe space can run to millions of entries, so metadata is
  // rebuilt on demand from the generator's compact descriptor index for the
  // handful of recipes that actually surface (the solver's top-N and the
  // selected row). Retaining a BuildRecipe for every recipe used to be the
  // single largest allocation in the whole pipeline.
  const recipeMetaRef = useRef<(recipeId: string) => BuildRecipe | undefined>(
    () => undefined
  )
  return {
    theoreticalDiscMapRef,
    enrichedValuesRef,
    theoreticalDiscMap,
    setTheoreticalDiscMap,
    recipeMetaRef,
  }
}
