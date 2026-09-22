import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type {
  GeneratedBuild,
  ICachedDisc,
  maxBuildsToShowList,
  StatFilters,
  Team,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import type { useCharacterContext } from '@zenless-optimizer/zzz/db-ui'
import { filterBuildsByStatFilters } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { useCallback } from 'react'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import { pinToggleForSelected } from './buildSelection'

/** Inputs for the build-actions hook — values owned by `OptimizeWrapper`. */
export type BuildActionInputs = {
  database: ZzzDatabase
  optConfigId: string
  character: NonNullable<ReturnType<typeof useCharacterContext>>
  characterKey: CharacterKey
  team: Team
  selectedBuild: GeneratedBuild
  allBuilds: GeneratedBuild[]
  /** `buildDate` of the current result set, fed back into a filtered re-run. */
  lastBuildDate: number | undefined
  statFiltersRef: { current: StatFilters }
  theoreticalDiscMapRef: { current: Record<string, ICachedDisc> }
}

/**
 * Every action the optimizer page can trigger: form/config writes, equip,
 * pin/unpin, clear-pins, and the stat-filter re-run. Verbatim move from
 * `Optimize/index.tsx`, which also owns the pin-related display-store
 * subscriptions — nothing else on the page reads them.
 */
export function useBuildActions(inputs: BuildActionInputs) {
  const {
    database,
    optConfigId,
    character,
    characterKey,
    team,
    selectedBuild,
    allBuilds,
    lastBuildDate,
    statFiltersRef,
    theoreticalDiscMapRef,
  } = inputs

  const clearPinnedBuilds = useOptimizerDisplayStore((s) => s.clearPinnedBuilds)
  const pinnedBuilds = useOptimizerDisplayStore((s) => s.pinnedBuilds)
  const addPinnedBuild = useOptimizerDisplayStore((s) => s.addPinnedBuild)
  const removePinnedBuild = useOptimizerDisplayStore((s) => s.removePinnedBuild)

  const onResultLimitChange = useCallback(
    (limit: number) => {
      database.optConfigs.set(optConfigId, {
        maxBuildsToShow: limit as (typeof maxBuildsToShowList)[number],
      })
    },
    [database.optConfigs, optConfigId]
  )

  const onCharacterChange = useCallback(
    (ck: CharacterKey) => {
      database.dbMeta.set({ optCharKey: ck })
    },
    [database.dbMeta]
  )

  const onWengineChange = useCallback(
    (wengineKey: string | undefined) => {
      database.chars.set(characterKey, {
        wengineKey: (wengineKey ?? '') as any,
        // Preserve the character's refinement when swapping engines
        wenginePhase: character.wenginePhase ?? 1,
      })
    },
    [database.chars, characterKey, character.wenginePhase]
  )

  const onReset = useCallback(() => {
    // TODO: Implement filter reset logic
    // This should reset all form fields to defaults
  }, [])

  const onEquip = useCallback(() => {
    if (!selectedBuild) return
    for (const discId of Object.values(selectedBuild.discIds)) {
      if (discId) {
        database.discs.set(discId, { location: characterKey })
      }
    }
  }, [selectedBuild, database.discs, characterKey])

  const onClearPins = useCallback(() => {
    clearPinnedBuilds()
  }, [clearPinnedBuilds])

  // Re-apply stat filters to existing results — narrows the build list
  // without re-running the search (only the INITIAL/FINAL filter sections)
  const onFilter = useCallback(() => {
    if (!allBuilds.length) return
    const filters = statFiltersRef.current ?? []
    if (!filters.length) return

    const getDisc = (id: string) =>
      theoreticalDiscMapRef.current[id] ?? database.discs.get(id) ?? undefined

    filterBuildsByStatFilters(
      allBuilds,
      character,
      team,
      filters,
      getDisc,
      (key) => database.chars.get(key) ?? undefined
    ).then((kept) => {
      if (kept.length === allBuilds.length) return
      database.optConfigs.newOrSetGeneratedBuildList(optConfigId, {
        builds: kept,
        buildDate: lastBuildDate ?? Date.now(),
      })
    })
  }, [
    allBuilds,
    character,
    team,
    database,
    optConfigId,
    statFiltersRef,
    theoreticalDiscMapRef,
    lastBuildDate,
  ])

  // Pin/unpin the currently selected build from the sidebar Pin button
  const onPin = useCallback(() => {
    const toggle = pinToggleForSelected(selectedBuild, pinnedBuilds, allBuilds)
    if (!toggle) return
    if (toggle.action === 'remove') removePinnedBuild(toggle.buildId)
    else addPinnedBuild(toggle.entry)
  }, [
    selectedBuild,
    pinnedBuilds,
    allBuilds,
    addPinnedBuild,
    removePinnedBuild,
  ])

  return {
    onResultLimitChange,
    onCharacterChange,
    onWengineChange,
    onReset,
    onEquip,
    onClearPins,
    onFilter,
    onPin,
  }
}
