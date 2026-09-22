import { Flex, Loader, Stack, Text } from '@mantine/core'
import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import { DeferCreate, DeferCreateProvider } from '@zenless-optimizer/common/ui'
import {
  type GeneratedBuild,
  getTeamFrame0,
  type StatFilters,
} from '@zenless-optimizer/zzz/db'
import {
  OptConfigContext,
  OptConfigProvider,
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import { useZzzCalcContext } from '@zenless-optimizer/zzz/formula-ui'
import { buildRowId } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { getCharStat } from '@zenless-optimizer/zzz/stats'
import { DiscEditorModal } from '@zenless-optimizer/zzz/ui'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '../hooks'
import type { StatDisplay } from '../Sidebar'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import { nextSelectedBuild } from './buildSelection'
import { ExpandedDataPanel } from './ExpandedDataPanel'
import { useEngineSelection } from './engineSelection'
import { OptimizerForm } from './OptimizerForm'
import { OptimizerGrid } from './OptimizerGrid'
import { OptimizerSidebarPanel } from './OptimizerSidebarPanel'
import { SelectedBuildPanel } from './SelectedBuildPanel'
import { useBuildActions } from './useBuildActions'
import { useBuildAnalysis } from './useBuildAnalysis'
import { useDiscPools } from './useDiscPools'
import { useSolverRun } from './useSolverRun'
import { useTheoreticalDiscStore } from './useTheoreticalDiscStore'
import { useTheoreticalReference } from './useTheoreticalReference'

export default function Optimize() {
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const { database } = useDatabaseContext()
  const mate = team.teammates.find((t) => t.characterKey === characterKey)
  const optConfigId = mate?.optConfigId

  useEffect(() => {
    if (!optConfigId) {
      const newOptConfigId = database.optConfigs.new({
        wEngineTypes: [getCharStat(characterKey).specialty],
      })
      database.teams.setTeammateOptConfigId(
        characterKey,
        characterKey,
        newOptConfigId
      )
    }
  }, [optConfigId, characterKey, database])

  if (!optConfigId) return null
  return (
    <OptConfigProvider optConfigId={optConfigId}>
      <OptimizeWrapper />
    </OptConfigProvider>
  )
}

function OptimizeWrapper() {
  const { database } = useDatabaseContext()
  const calc = useZzzCalcContext()
  const character = useCharacterContext()!
  const { key: characterKey } = character
  const team = useTeam(characterKey)!
  const { tag: target } = getTeamFrame0(team)
  const { optConfig, optConfigId } = useContext(OptConfigContext)
  const { engine, setEngine } = useEngineSelection(
    optConfig.engine,
    optConfigId,
    database
  )
  const statFiltersRef = useRef<StatFilters>(optConfig.statFilters ?? [])

  // Keep the stat filter ref in sync with the persisted config (e.g. when a
  // preset replaces the stat filters) so optimizer runs use the latest values.
  useEffect(() => {
    statFiltersRef.current = optConfig.statFilters ?? []
  }, [optConfig.statFilters])

  // Sidebar display state — individual subscriptions to stable setter functions
  // avoids re-rendering on unrelated store changes
  const setPermutationDetails = useOptimizerDisplayStore(
    (s) => s.setPermutationDetails
  )
  const setPermutations = useOptimizerDisplayStore((s) => s.setPermutations)
  const setPermutationsSearched = useOptimizerDisplayStore(
    (s) => s.setPermutationsSearched
  )
  const setPermutationsResults = useOptimizerDisplayStore(
    (s) => s.setPermutationsResults
  )
  const setOptimizationInProgress = useOptimizerDisplayStore(
    (s) => s.setOptimizationInProgress
  )
  const setOptimizerStartTime = useOptimizerDisplayStore(
    (s) => s.setOptimizerStartTime
  )
  const setOptimizerEndTime = useOptimizerDisplayStore(
    (s) => s.setOptimizerEndTime
  )
  const setOptimizerProgress = useOptimizerDisplayStore(
    (s) => s.setOptimizerProgress
  )

  // Theoretical max mode toggle (local state to avoid OptConfig re-render cascade)
  const [useTheoreticalMax, setUseTheoreticalMax] = useState(false)

  // Theoretical max disc cache — maps fake disc IDs to ICachedDisc for stat computation
  // Uses a ref for synchronous access (avoids race with batchComputeBuildStats)
  // and React state for triggering re-renders
  const {
    theoreticalDiscMapRef,
    enrichedValuesRef,
    theoreticalDiscMap,
    setTheoreticalDiscMap,
    recipeMetaRef,
  } = useTheoreticalDiscStore()

  // Stat display toggle (combat vs basic stats in grid)
  const [statDisplay, setStatDisplay] = useState<StatDisplay>('combat')

  // Search space: disc pools per slot, wengine keys to sweep, and the
  // permutation counts the sidebar reports.
  const { discsBySlot, filteredWengineKeys, totalPermutations } = useDiscPools({
    database,
    characterKey,
    equippedWengineKey: character.wengineKey,
    optConfig,
    setPermutationDetails,
    setPermutations,
  })

  // Bumped by a completed solver run to force the grid to re-sort
  const [sortTrigger, setSortTrigger] = useState(0)

  const { optimizing, progress, onOptimize, onCancel } = useSolverRun({
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
    recipeMetaRef,
  })

  // Equipped build: the character's currently equipped discs + wengine (always first row)
  const equippedBuild = useMemo(
    (): GeneratedBuild => ({
      wengineKey: character.wengineKey || undefined,
      discIds: character.equippedDiscs,
      value: 0,
    }),
    [character.wengineKey, character.equippedDiscs]
  )

  // Selected build for disc preview below grid — start with equipped build by default
  const [selectedBuild, setSelectedBuild] =
    useState<GeneratedBuild>(equippedBuild)

  // Update progress in sidebar
  useEffect(() => {
    if (progress) {
      setPermutationsSearched(progress.computed)
      setPermutationsResults(progress.computed)
      if (totalPermutations > 0) {
        setOptimizerProgress(
          progress.computed / (progress.computed + progress.remaining || 1)
        )
      }
    }
  }, [
    progress,
    totalPermutations,
    setPermutationsSearched,
    setPermutationsResults,
    setOptimizerProgress,
  ])

  // Get generated builds for the grid (reactive — updates when list changes)
  const generatedBuildList =
    useDataManagerBase(
      database.generatedBuildList,
      optConfig.generatedBuildListId ?? ''
    ) || undefined

  // Generated builds only (used as main grid rows)
  const allBuilds = useMemo(
    () => generatedBuildList?.builds ?? [],
    [generatedBuildList?.builds]
  )

  // Pinned theoretical reference for this character (reactive). Absent
  // means the reference feature stays invisible for this character.
  const pinnedReference =
    useDataManagerBase(database.theoReferences, characterKey) ?? undefined

  // Reset the selected build only when a genuinely new result set arrives
  // (new optimizer run or different build list). Unrelated DB updates must
  // keep the current selection so the grid stays on the user's chosen row.
  const resultIdentity = `${optConfig.generatedBuildListId}:${generatedBuildList?.buildDate ?? ''}`
  const lastResultIdentityRef = useRef(resultIdentity)
  useEffect(() => {
    const isNewResultSet = lastResultIdentityRef.current !== resultIdentity
    lastResultIdentityRef.current = resultIdentity
    setSelectedBuild((current) =>
      nextSelectedBuild({
        isNewResultSet,
        builds: generatedBuildList?.builds ?? [],
        useTheoreticalMax,
        equippedBuild,
        current,
        allBuilds,
      })
    )
  }, [
    resultIdentity,
    generatedBuildList?.builds,
    allBuilds,
    equippedBuild,
    useTheoreticalMax,
  ])

  // Form/config writes, equip, pin/unpin, clear-pins, stat-filter re-run.
  const {
    onResultLimitChange,
    onCharacterChange,
    onWengineChange,
    onReset,
    onEquip,
    onClearPins,
    onFilter,
    onPin,
  } = useBuildActions({
    database,
    optConfigId,
    character,
    characterKey,
    team,
    selectedBuild,
    allBuilds,
    lastBuildDate: generatedBuildList?.buildDate,
    statFiltersRef,
    theoreticalDiscMapRef,
  })

  // Pin the selected build as this character's perfect reference, and
  // rehydrate the disc map from a persisted reference on load.
  const { onPinReference } = useTheoreticalReference({
    selectedBuild,
    pinnedReference,
    database,
    character,
    characterKey,
    team,
    target,
    setFilter2: optConfig.setFilter2,
    setFilter4: optConfig.setFilter4,
    enrichedValuesRef,
    recipeMetaRef,
    theoreticalDiscMapRef,
    setTheoreticalDiscMap,
  })

  // Recompute per-build stats + the selected build's analysis payload.
  const {
    enrichedBuilds,
    isComputingStats,
    analysisData,
    isComputingAnalysis,
  } = useBuildAnalysis({
    equippedBuild,
    allBuilds,
    selectedBuild,
    character,
    characterKey,
    team,
    database,
    target,
    pinnedReference,
    setFilter2: optConfig.setFilter2,
    setFilter4: optConfig.setFilter4,
    theoreticalDiscMap,
    theoreticalDiscMapRef,
    enrichedValuesRef,
  })

  const { t } = useTranslation('page_optimize')
  const { isMobileLayout } = useResponsive()

  if (generatedBuildList && generatedBuildList.builds.length > 0) {
    console.log(
      '[Display] useTheoreticalMax=',
      useTheoreticalMax,
      '| discIds[1]=',
      selectedBuild.discIds['1'],
      '| startsWith=',
      selectedBuild.discIds['1']?.startsWith('recipe_'),
      '| mapKeys=',
      Object.keys(theoreticalDiscMap).length,
      '| selectedValue=',
      selectedBuild.value
    )
  }

  return (
    <DeferCreateProvider enabled={true} resetKey={characterKey}>
      <Flex
        gap="md"
        align="flex-start"
        style={{
          width: '100%',
          paddingBottom: isMobileLayout ? 80 : 0,
        }}
      >
        {/* ─── Left Column: Form + Grid ─── */}
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          {/* Form Area */}
          <OptimizerForm
            characterKey={characterKey}
            character={character}
            team={team}
            discsBySlot={discsBySlot}
            statFiltersRef={statFiltersRef}
            onCharacterChange={onCharacterChange}
            onWengineChange={onWengineChange}
            useTheoreticalMax={useTheoreticalMax}
            setUseTheoreticalMax={setUseTheoreticalMax}
          />

          {/* Results Grid — kept mounted while stats recompute (overlay
              loader instead of unmount) so selection/scroll survive DB updates */}
          <DeferCreate>
            <div style={{ position: 'relative' }}>
              <OptimizerGrid
                builds={allBuilds}
                enrichedBuilds={enrichedBuilds}
                pinnedBuild={equippedBuild}
                statDisplay={statDisplay}
                sortTrigger={sortTrigger}
                specialityKey={getCharStat(characterKey).specialty}
                selectedBuildId={
                  selectedBuild ? buildRowId(selectedBuild) : undefined
                }
                onBuildSelect={(build) => {
                  setSelectedBuild(build)
                }}
              />
              {isComputingStats && (
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    borderRadius: 6,
                    zIndex: 10,
                    gap: 8,
                    pointerEvents: 'none',
                  }}
                >
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">
                    {t('grid.computingStats', 'Computing build stats...')}
                  </Text>
                </Flex>
              )}
            </div>
          </DeferCreate>

          {/* Selected build preview — show recipe summary in theoretical mode, otherwise disc cards */}
          {selectedBuild && (
            <SelectedBuildPanel
              selectedBuild={selectedBuild}
              enrichedBuilds={enrichedBuilds}
              resolveRecipeMeta={recipeMetaRef.current}
              theoreticalDiscMap={theoreticalDiscMap}
              useTheoreticalMax={useTheoreticalMax}
              characterKey={characterKey}
              isPinned={!!pinnedReference}
              pinnedRecipeId={pinnedReference?.bestRecipe?.id}
              onPinReference={onPinReference}
            />
          )}

          {/* Optimization Results Analysis */}
          <DeferCreate>
            <ExpandedDataPanel
              analysisData={analysisData}
              isComputingAnalysis={isComputingAnalysis}
            />
          </DeferCreate>
        </Stack>

        {/* ─── Right Column: Sticky Sidebar (233px) + mobile bottom bar ─── */}
        <OptimizerSidebarPanel
          isMobileLayout={isMobileLayout}
          optimizing={optimizing}
          totalPermutations={totalPermutations}
          hasTarget={!!target}
          statDisplay={statDisplay}
          useTheoreticalMax={useTheoreticalMax}
          engine={engine}
          resultLimit={optConfig.maxBuildsToShow}
          selectedBuild={selectedBuild}
          characterKey={characterKey}
          onEngineChange={setEngine}
          onOptimize={onOptimize}
          onCancel={onCancel}
          onReset={onReset}
          onResultLimitChange={onResultLimitChange}
          onStatDisplayChange={setStatDisplay}
          onEquip={onEquip}
          onFilter={onFilter}
          onPin={onPin}
          onClearPins={onClearPins}
        />
      </Flex>

      {/* Disc editor modal (global, opened by clicking disc cards) */}
      <DiscEditorModal />
    </DeferCreateProvider>
  )
}
