import type {
  BuildResult,
  Candidate,
  Progress as SolverProgress,
} from '@zenless-optimizer/game-opt/solver'
import { Solver } from '@zenless-optimizer/game-opt/solver'
import { WebGpuSolver } from '@zenless-optimizer/game-opt/solver-webgpu'
import type { CharacterKey, PhaseKey } from '@zenless-optimizer/zzz/consts'
import type {
  BuildRecipe,
  ICachedDisc,
  OptConfig,
  OptFrame,
  OptimizerEngine,
  StatFilters,
  Team,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import { maxPersistedGeneratedBuilds } from '@zenless-optimizer/zzz/db'
import type { useCharacterContext } from '@zenless-optimizer/zzz/db-ui'
import type { useZzzCalcContext } from '@zenless-optimizer/zzz/formula-ui'
import type { TheoryPipelineOutput } from '@zenless-optimizer/zzz/solver'
import {
  createSolverConfig,
  runTheoryPipelineInWorker,
} from '@zenless-optimizer/zzz/solver'
import {
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { filterDiscsBySlot, filterWengineKeys } from './discFiltering'
import { getGpuTuningParams } from './optimizeUtils'
import {
  collectReturnedRecipes,
  materializeReturnedDiscs,
  resolveSolverFrames,
  toStoredBuilds,
} from './solverResults'
import {
  buildTheoryPermutationDetails,
  createRecipeMetaResolver,
  readDebugSubstatTargets,
  sliceResultsToLimit,
} from './solverRunUtils'

/** Inputs for the solver-run hook — all values owned by `OptimizeWrapper`. */
export type SolverRunInputs = {
  calc: ReturnType<typeof useZzzCalcContext>
  target: OptFrame['tag']
  team: Team
  character: NonNullable<ReturnType<typeof useCharacterContext>>
  characterKey: CharacterKey
  statFiltersRef: { current: StatFilters }
  useTheoreticalMax: boolean
  database: ZzzDatabase
  optConfig: OptConfig
  optConfigId: string
  filteredWengineKeys: ReturnType<typeof filterWengineKeys>
  discsBySlot: ReturnType<typeof filterDiscsBySlot>
  engine: OptimizerEngine
  setOptimizationInProgress: (inProgress: boolean) => void
  setOptimizerStartTime: (time: number | null) => void
  setOptimizerEndTime: (time: number | null) => void
  setOptimizerProgress: (progress: number) => void
  setPermutationsSearched: (n: number) => void
  setPermutationsResults: (n: number) => void
  setPermutationDetails: (
    details: Record<string, { count: number; total: number }>
  ) => void
  setPermutations: (n: number) => void
  setSortTrigger: Dispatch<SetStateAction<number>>
  theoreticalDiscMapRef: { current: Record<string, ICachedDisc> }
  setTheoreticalDiscMap: Dispatch<SetStateAction<Record<string, ICachedDisc>>>
  /** Per-run recipe metadata resolver — written on each theoretical run. */
  runRecipeMetaRef: { current: (recipeId: string) => BuildRecipe | undefined }
  /** Recipe metadata persisted with the result set; updated in lockstep
   * with the build-list write so persisted-first resolution never goes stale. */
  persistedRecipesRef: { current: Record<string, BuildRecipe> }
  /** Identity of the result set the disc map was built for — bumped on
   * every completed run (see `useTheoreticalDiscStore`). */
  discMapIdentityRef: { current: string }
}

/**
 * Solver-run orchestration: worker counts, progress, cancel tokens,
 * `onOptimize` (CPU/GPU + theoretical-max pipeline) and `onCancel`.
 * Verbatim move from `Optimize/index.tsx` — inputs are destructured to
 * the original names so the body is byte-identical.
 */
export function useSolverRun(inputs: SolverRunInputs) {
  const {
    calc,
    target,
    team,
    character,
    characterKey,
    statFiltersRef,
    useTheoreticalMax,
    database,
    optConfig,
    optConfigId,
    filteredWengineKeys,
    discsBySlot,
    engine,
    setOptimizationInProgress,
    setOptimizerStartTime,
    setOptimizerEndTime,
    setOptimizerProgress,
    setPermutationsSearched,
    setPermutationsResults,
    setPermutationDetails,
    setPermutations,
    setSortTrigger,
    theoreticalDiscMapRef,
    setTheoreticalDiscMap,
    runRecipeMetaRef,
    persistedRecipesRef,
    discMapIdentityRef,
  } = inputs
  const [numWorkers] = useState(() =>
    Math.min(navigator.hardwareConcurrency || 4, 8)
  )
  const [progress, setProgress] = useState<SolverProgress | undefined>(
    undefined
  )

  const [optimizing, setOptimizing] = useState(false)

  const cancelToken = useRef(() => {})
  useEffect(() => () => cancelToken.current(), [])

  const onOptimize = useCallback(
    async (event: MouseEvent) => {
      if (!calc || !target) return
      const cancelled = new Promise<void>((r) => (cancelToken.current = r))
      setProgress(undefined)
      setOptimizing(true)
      setOptimizationInProgress(true)
      setOptimizerStartTime(Date.now())
      setOptimizerEndTime(null)
      setOptimizerProgress(0)
      setPermutationsSearched(0)
      setPermutationsResults(0)

      // Let React paint the optimizing state before the recipe enumeration
      // starts. Enumeration is synchronous and can take seconds on a wide
      // configuration, and without this yield the browser never gets a frame,
      // so the page just looks frozen with no feedback at all.
      await new Promise((resolve) => setTimeout(resolve, 0))

      const statFilters = (statFiltersRef.current ?? []).filter(
        (s) => !s.disabled
      )
      // Combo frames carry per-hit tags, multipliers and (in advanced
      // mode) per-hit buff overrides. Each frame maps to calc preset${i}.
      const frames = resolveSolverFrames(team, target)

      // When theoretical max mode is on, generate build-level recipes (one
      // candidate = total stats across all 6 discs) instead of per-slot
      // individual discs. This avoids solver duplicates where the same
      // aggregate stat distribution appears in different slot arrangements.
      console.log(
        '[Optimize] useTheoreticalMax =',
        useTheoreticalMax,
        '| setFilter2 =',
        optConfig.setFilter2,
        '| setFilter4 =',
        optConfig.setFilter4
      )
      let activeRecipes: Candidate<string>[] | undefined
      let activeDiscMap: Record<string, ICachedDisc> = {}

      if (useTheoreticalMax) {
        // Debug override: set localStorage['zz_debug_substat_targets'] to
        // a JSON object like {"atk_":23,"ap":16} to force specific substat
        // roll counts for verification. Clear it (delete the key) to restore
        // normal exhaustive search.
        const debugTargets = readDebugSubstatTargets(localStorage)
        if (debugTargets)
          console.warn(
            '[TheoreticalMax] DEBUG substat roll targets active:',
            debugTargets
          )
        // Generation and pruning are the two long, synchronous, CPU-bound
        // stages of theoretical-max: on a wide configuration they produce
        // millions of recipes and take seconds to tens of seconds of work.
        // Both accept nothing but plain data, so they run in a worker and only
        // the surviving recipes come back — the page keeps painting, the run
        // stays cancellable, and the full pool never reaches this thread.
        //
        // Pruning needs the node graph, which `createSolverConfig` builds. The
        // graph does not depend on the recipes themselves (only on the
        // *presence* of a recipe pool, which adds the crit-overcap
        // constraint), so it is built once up front with an empty placeholder
        // pool and the real pool is passed in afterwards.
        const scaffold = createSolverConfig(
          characterKey,
          calc,
          frames,
          statFilters,
          optConfig.setFilter2,
          optConfig.setFilter4,
          filteredWengineKeys,
          character.wenginePhase as PhaseKey,
          discsBySlot,
          numWorkers,
          optConfig.maxBuildsToShow,
          setProgress,
          []
        )
        // When the GPU engine is selected, skip CPU prune entirely: the GPU
        // can evaluate all permutations and reject candidates in the shader,
        // making CPU-side dominance filtering pure overhead. The full recipe
        // pool is passed directly to the GPU, which sweeps it trivially fast.
        const skipPrune = engine === 'gpu'
        const handle = runTheoryPipelineInWorker(
          {
            generator: {
              characterKey,
              setFilter2: optConfig.setFilter2,
              setFilter4: optConfig.setFilter4,
              slotFilters: {
                4: optConfig.slot4,
                5: optConfig.slot5,
                6: optConfig.slot6,
              },
              substatRollTargets: debugTargets,
              options: {
                minEffectivePerCombo: optConfig.theoreticalMinEffectivePerCombo,
                applyDominanceFilter:
                  optConfig.theoreticalApplyDominanceFilter ?? true,
              },
            },
            // Slot layout is [w-engine, recipes, empty_2 .. empty_6]
            before: scaffold.candidates.slice(0, 1),
            after: scaffold.candidates.slice(2),
            nodes: scaffold.nodes,
            minimum: scaffold.minimum,
            topN: scaffold.topN,
            skipPrune,
          },
          (stage) => {
            if (stage !== 'done') console.debug('[TheoreticalMax] stage', stage)
          }
        )
        cancelled.then(() => handle.cancel('user cancelled'))
        let pipeline: TheoryPipelineOutput
        try {
          pipeline = await handle.result
        } catch (e) {
          console.error('TheoreticalMax: recipe pipeline failed:', e)
          setOptimizing(false)
          setOptimizationInProgress(false)
          return
        }
        // NOTE: never touch a recipeMap here. It materializes a BuildRecipe for
        // every single recipe, which is exactly the allocation the compact
        // descriptor index exists to avoid.
        console.debug(
          '[TheoreticalMax] generated',
          pipeline.stats,
          '|',
          pipeline.pruned
            ? `kept ${pipeline.recipeCandidates.length} of ${pipeline.totalRecipes}`
            : `pool ${pipeline.totalRecipes} (skip prune, GPU path)`,
          '| combinations',
          pipeline.beforeCount,
          '->',
          pipeline.afterCount
        )
        if (pipeline.recipeCandidates.length === 0) {
          console.warn('[TheoreticalMax] No recipes generated!')
        } else {
          // Log first surviving recipe for debugging
          console.debug(
            '[TheoreticalMax] sample recipe:',
            pipeline.recipeCandidates[0]
          )
        }
        activeRecipes = pipeline.recipeCandidates
        // Keep only the resolver: the descriptor index plus the generator's
        // (plain-data) context are all a recipe's metadata needs, so nothing is
        // stored per-recipe here.
        runRecipeMetaRef.current = createRecipeMetaResolver(pipeline)
        // Start with empty disc map; we populate it after the solver returns
        // with only the recipes that end up in the final build results
        activeDiscMap = {}

        // Update sidebar with recipe counts. These report the full generated
        // space, not just what survived pruning — that is what the search space
        // is measured in, and the pruned pool size is logged above.
        setPermutations(pipeline.totalRecipes * filteredWengineKeys.length)
        setPermutationDetails(
          buildTheoryPermutationDetails(pipeline.totalRecipes)
        )
      }
      // Set ref and state for disc lookup (currently empty; will be populated
      // after solver returns with only the returned recipes' disc objects)
      theoreticalDiscMapRef.current = activeDiscMap
      setTheoreticalDiscMap(activeDiscMap)

      console.debug(
        '[TheoreticalMax] Solver config:',
        'recipes=',
        activeRecipes?.length ?? 'N/A',
        'wengineCount=',
        filteredWengineKeys.length
      )

      const config = createSolverConfig(
        characterKey,
        calc,
        frames,
        statFilters,
        optConfig.setFilter2,
        optConfig.setFilter4,
        filteredWengineKeys,
        character.wenginePhase as PhaseKey,
        discsBySlot, // unused in theoretical mode when recipeCandidates is provided
        numWorkers,
        optConfig.maxBuildsToShow,
        setProgress,
        activeRecipes // when provided, solver uses these instead of per-slot discs
      )

      if (event.altKey) {
        console.log(config)
        setOptimizing(false)
        setOptimizationInProgress(false)
        return
      }

      const optimizer =
        engine === 'gpu'
          ? new WebGpuSolver(config, getGpuTuningParams())
          : new Solver(config)

      cancelled.then(() => optimizer.terminate('user cancelled'))
      let results: BuildResult<string>[]
      try {
        results = await optimizer.results
      } catch (e) {
        console.error('TheoreticalMax: Optimizer failed:', e)
        return
      } finally {
        cancelToken.current = () => {}
        setOptimizing(false)
        setOptimizationInProgress(false)
        setOptimizerEndTime(Date.now())
        if (progress) {
          setOptimizerProgress(1)
          setPermutationsSearched(progress.computed)
          setPermutationsResults(progress.computed)
        }
      }
      console.debug(
        '[TheoreticalMax] Solver returned',
        results.length,
        'builds'
      )

      // Slice to user-requested count — the solver uses a larger internal
      // topN for pruning quality, so it may return more than requested.
      results = sliceResultsToLimit(results, optConfig.maxBuildsToShow)
      if (results.length > 0) {
        console.debug(
          '[TheoreticalMax] First 5 values:',
          results.slice(0, 5).map((r) => Math.floor(r.value))
        )
        console.debug(
          '[TheoreticalMax] theoreticalDiscMap keys at storage time:',
          Object.keys(activeDiscMap).slice(0, 5)
        )
      }
      const storedBuilds = toStoredBuilds(results)

      // After solver returns, create disc objects only for the returned
      // builds (avoids OOM from pre-creating discs for ALL recipes).
      // The run resolver materializes them from the pipeline's compact
      // descriptor index — no per-recipe metadata is retained.
      if (useTheoreticalMax) {
        const returnedDiscMap = materializeReturnedDiscs(
          storedBuilds,
          runRecipeMetaRef.current
        )
        activeDiscMap = returnedDiscMap
        theoreticalDiscMapRef.current = returnedDiscMap
        setTheoreticalDiscMap(returnedDiscMap)
      }

      // Recipe metadata for the rows that survive a reload, stored with the
      // build list so the `recipe_*` disc ids stay resolvable after a page
      // switch or refresh (the pipeline resolver above never outlives the
      // session). Assigned synchronously so the composed resolver sees the
      // new result set the moment it lands; `{}` clears a previous
      // theoretical run's recipes when this run used real discs.
      const recipes = useTheoreticalMax
        ? collectReturnedRecipes(
            storedBuilds,
            runRecipeMetaRef.current,
            maxPersistedGeneratedBuilds
          )
        : {}
      persistedRecipesRef.current = recipes

      const buildDate = Date.now()
      database.optConfigs.newOrSetGeneratedBuildList(optConfigId, {
        builds: storedBuilds,
        buildDate,
        recipes,
      })
      // The disc map above now belongs to this result set — tell the
      // hydration effect so it doesn't rebuild (and re-stats) it.
      discMapIdentityRef.current = `${optConfigId}:${buildDate}`
      setPermutationsResults(results.length)
      setSortTrigger((g) => g + 1)
    },
    [
      calc,
      target,
      team,
      statFiltersRef,
      runRecipeMetaRef,
      persistedRecipesRef,
      discMapIdentityRef,
      setTheoreticalDiscMap,
      theoreticalDiscMapRef,
      useTheoreticalMax,
      database,
      optConfig.setFilter2,
      optConfig.setFilter4,
      optConfig.maxBuildsToShow,
      optConfig.slot4,
      optConfig.slot5,
      optConfig.slot6,
      optConfig.theoreticalApplyDominanceFilter,
      optConfig.theoreticalMinEffectivePerCombo,
      character.wenginePhase,
      characterKey,
      filteredWengineKeys,
      discsBySlot,
      numWorkers,
      engine,
      optConfigId,
      setOptimizationInProgress,
      setOptimizerStartTime,
      setOptimizerEndTime,
      setOptimizerProgress,
      setPermutationsSearched,
      setPermutationsResults,
      setPermutationDetails,
      setPermutations,
      setSortTrigger,
      progress,
    ]
  )

  const onCancel = useCallback(() => {
    cancelToken.current()
    setOptimizing(false)
    setOptimizationInProgress(false)
  }, [cancelToken, setOptimizationInProgress])

  return { optimizing, progress, onOptimize, onCancel }
}
