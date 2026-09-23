import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import {
  type GeneratedBuild,
  type ICachedDisc,
  isTheoReferenceStale,
  type OptConfig,
  type OptFrame,
  type Team,
  type TheoReference,
  type ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import type { useCharacterContext } from '@zenless-optimizer/zzz/db-ui'
import type { EnrichedBuild } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import {
  batchComputeBuildStats,
  buildRowId,
} from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { useEffect, useMemo, useState } from 'react'
import { getMergedSubstatWeights } from '../../page-discs/scoring/statWeightUtils'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { buildAnalysisData } from '../Analysis/ExpandedDataPanelController'
import { buildTheoContextSnapshot } from '../reference/referenceScoring'
import { resolveEnrichmentFormulaTag } from './buildSelection'

/** Inputs for the build-analysis hook — values owned by `OptimizeWrapper`. */
export type BuildAnalysisInputs = {
  /** The character's equipped build — the grid's always-present first row. */
  equippedBuild: GeneratedBuild
  /** Generated builds from the last optimizer run. */
  allBuilds: GeneratedBuild[]
  selectedBuild: GeneratedBuild
  character: NonNullable<ReturnType<typeof useCharacterContext>>
  characterKey: CharacterKey
  team: Team
  database: ZzzDatabase
  target: OptFrame['tag']
  pinnedReference: TheoReference | undefined
  setFilter2: OptConfig['setFilter2']
  setFilter4: OptConfig['setFilter4']
  /** Reactive form of the theoretical disc cache (drives recomputation). */
  theoreticalDiscMap: Record<string, ICachedDisc>
  theoreticalDiscMapRef: { current: Record<string, ICachedDisc> }
  /** Boosted disc versions for "Potentially Best Discs" mode, keyed by real
   * disc ID. Only consulted when `usePotentialBest` is true. */
  usePotentialBest: boolean
  potentialDiscMap: Record<string, ICachedDisc>
  /** Display-canonical build values, refreshed whenever stats are recomputed. */
  enrichedValuesRef: { current: Map<string, number> }
}

/**
 * Stats enrichment + analysis payload for the grid and the Analysis panel.
 * Verbatim move from `Optimize/index.tsx`: recomputes per-build stats on
 * every build-set / disc-map change, and derives the `AnalysisData` for the
 * selected build (including the pinned perfect reference, if any).
 */
export function useBuildAnalysis(inputs: BuildAnalysisInputs) {
  const {
    equippedBuild,
    allBuilds,
    selectedBuild,
    character,
    characterKey,
    team,
    database,
    target,
    pinnedReference,
    setFilter2,
    setFilter4,
    theoreticalDiscMap,
    theoreticalDiscMapRef,
    usePotentialBest,
    potentialDiscMap,
    enrichedValuesRef,
  } = inputs

  // Includes equipped build + generated builds for stats computation
  // (stats are needed for both the pinned equipped build and regular rows)
  const buildsForStats = useMemo(() => {
    return [equippedBuild, ...allBuilds]
  }, [equippedBuild, allBuilds])

  // Enriched builds state (stats computed for each build)
  const [enrichedBuilds, setEnrichedBuilds] = useState<EnrichedBuild[]>([])
  const [isComputingStats, setIsComputingStats] = useState(false)

  // Compute enriched stats when builds change (equipped or generated)
  useEffect(() => {
    const builds = buildsForStats
    if (builds.length === 0) {
      setEnrichedBuilds([])
      setIsComputingStats(false)
      return
    }

    // Get the optimization target formula tag from the team's first frame.
    // Rotations expand via getComboFrames so the selected combo metric
    // (DMG/Daze/Buildup) is reflected in the per-build values. Multipliers
    // are preserved and hit `i` reads on `preset${i}`, matching the solver.
    const formulaTag = resolveEnrichmentFormulaTag(team)

    let cancelled = false
    setIsComputingStats(true)

    const getDisc = (id: string) =>
      theoreticalDiscMapRef.current[id] ??
      (usePotentialBest ? potentialDiscMap[id] : undefined) ??
      database.discs.get(id) ??
      undefined

    batchComputeBuildStats(
      builds,
      getDisc,
      character,
      team,
      // Optional progress tracking
      undefined,
      formulaTag,
      (key) => database.chars.get(key) ?? undefined
    ).then((enriched) => {
      if (!cancelled) {
        setEnrichedBuilds(enriched)
        enrichedValuesRef.current = new Map(
          enriched.map((e) => [e.id, e.value])
        )
        setIsComputingStats(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    buildsForStats,
    character,
    enrichedValuesRef,
    team,
    database,
    theoreticalDiscMap,
    theoreticalDiscMapRef,
    usePotentialBest,
    potentialDiscMap,
  ])

  // Analysis data for the ExpandedDataPanel.
  //
  // The per-source attribution rebuilds the calculator once per source group
  // (`explainContributions`), which is seconds of work on a full team. Running
  // that inside a render pass froze the whole page — and every navigation
  // attempted while it ran — so it is deferred past the first paint, yields
  // between builds, and abandons the run as soon as the inputs change or the
  // page unmounts.
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isComputingAnalysis, setIsComputingAnalysis] = useState(false)
  useEffect(() => {
    if (!selectedBuild || !team) {
      setAnalysisData(null)
      setIsComputingAnalysis(false)
      return
    }
    let cancelled = false
    setIsComputingAnalysis(true)
    const handle = setTimeout(() => {
      const getDisc = (id: string) =>
        theoreticalDiscMapRef.current[id] ??
        (usePotentialBest ? potentialDiscMap[id] : undefined) ??
        database.discs.get(id) ??
        undefined
      const equippedBuildId = buildRowId(equippedBuild)
      // Pinned perfect reference (absent = feature invisible). Staleness
      // compares the pin-time target/filter snapshot with the current one.
      const reference = pinnedReference
        ? {
            profile: {
              perfectRolls: pinnedReference.perfectRolls,
              mainsBySlot: pinnedReference.mainsBySlot,
            },
            value: pinnedReference.value,
            date: pinnedReference.date,
            stale: isTheoReferenceStale(
              pinnedReference,
              buildTheoContextSnapshot(target, setFilter2, setFilter4)
            ),
            weights: getMergedSubstatWeights(characterKey, database),
            set4: pinnedReference.set4,
            set2: pinnedReference.set2,
            wengineKey: pinnedReference.wengineKey,
            combatStats: pinnedReference.referenceCombatStats,
          }
        : null
      buildAnalysisData(
        {
          selectedBuild,
          enrichedBuilds,
          equippedBuildId,
          getDisc,
          team,
          character,
          getTeammateChar: (key) => database.chars.get(key) ?? undefined,
          reference,
        },
        { shouldCancel: () => cancelled }
      )
        .then((data) => {
          if (cancelled) return
          setAnalysisData(data)
          setIsComputingAnalysis(false)
        })
        .catch((e) => {
          console.error('[Analysis] failed to build analysis data:', e)
          if (cancelled) return
          setIsComputingAnalysis(false)
        })
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [
    selectedBuild,
    enrichedBuilds,
    equippedBuild,
    team,
    character,
    database,
    pinnedReference,
    target,
    theoreticalDiscMapRef,
    setFilter2,
    setFilter4,
    characterKey,
    usePotentialBest,
    potentialDiscMap,
  ])

  return { enrichedBuilds, isComputingStats, analysisData, isComputingAnalysis }
}
