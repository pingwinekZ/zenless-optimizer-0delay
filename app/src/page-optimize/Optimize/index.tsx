import { Box, Button, Flex, Loader, Stack, Text } from '@mantine/core'
import {
  useDataManagerBase,
  useDataManagerValues,
} from '@zenless-optimizer/common/database-ui'
import { DeferCreate, DeferCreateProvider } from '@zenless-optimizer/common/ui'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type {
  BuildResult,
  Candidate,
  Progress as SolverProgress,
} from '@zenless-optimizer/game-opt/solver'
import { buildCount, Solver } from '@zenless-optimizer/game-opt/solver'
import {
  WebGpuSolver,
  type WebGpuSolverOptions,
} from '@zenless-optimizer/game-opt/solver-webgpu'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
  PhaseKey,
} from '@zenless-optimizer/zzz/consts'
import {
  allDiscSlotKeys,
  getDiscSubStatBaseVal,
} from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import {
  type DiscIds,
  type GeneratedBuild,
  getComboFrames,
  getTeamFrame0,
  type ICachedDisc,
  isComboTarget,
  isTheoReferenceStale,
  type maxBuildsToShowList,
  type OptimizerEngine,
  type StatFilters,
  type TheoReference,
  targetTag,
} from '@zenless-optimizer/zzz/db'
import {
  OptConfigContext,
  OptConfigProvider,
  useCharacterContext,
  useDatabaseContext,
  useDiscs,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import { useZzzCalcContext } from '@zenless-optimizer/zzz/formula-ui'
import {
  createSolverConfig,
  materializeRecipeFromIndex,
  runTheoryPipelineInWorker,
  type TheoryPipelineOutput,
} from '@zenless-optimizer/zzz/solver'
import type { EnrichedBuild } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import {
  batchComputeBuildStats,
  buildRowId,
  computeBuildStats,
  filterBuildsByStatFilters,
} from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { getCharStat, getWengineStat } from '@zenless-optimizer/zzz/stats'
import {
  DiscEditorModal,
  useDiscEditorModalStore,
} from '@zenless-optimizer/zzz/ui'
import {
  DiscSet2p,
  DiscSetName,
} from '@zenless-optimizer/zzz/ui/Disc/DiscTrans'
import { hasHigherPriority } from '@zenless-optimizer/zzz/util'
import type { MouseEvent } from 'react'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ShowcaseDiscCard } from '../../page-characters'
import { discCardH, discCardW } from '../../page-characters/constantsUi'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from '../../page-discs/scoring/statWeightUtils'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { buildAnalysisData } from '../Analysis/ExpandedDataPanelController'
import { BuildsSection } from '../BuildManagement'
import { useResponsive } from '../hooks'
import { ResponsiveBottomBar } from '../layout'
import {
  buildReferenceProfile,
  buildTheoContextSnapshot,
} from '../reference/referenceScoring'
import type { StatDisplay } from '../Sidebar'
import {
  OptimizerControlsSection,
  PermutationsSection,
  ResultsSection,
} from '../Sidebar'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import { ExpandedDataPanel } from './ExpandedDataPanel'
import { OptimizerForm } from './OptimizerForm'
import { OptimizerGrid } from './OptimizerGrid'

/**
 * Renders the 6 showcase-style disc cards in a single horizontal row
 * for a selected build's discIds.
 * Clicking a disc opens the disc editor modal.
 * Extracted as a separate component so the `useDiscs` hook is always
 * called unconditionally (Rules of Hooks).
 */
/**
 * Renders the 6 showcase-style disc cards in a single horizontal row
 * for a selected build's discIds.
 * Clicking a disc opens the disc editor modal.
 */
function SelectedBuildDiscs({
  discIds,
  characterKey,
  theoreticalDiscMap,
}: {
  discIds: DiscIds
  characterKey: CharacterKey
  theoreticalDiscMap?: Record<string, ICachedDisc>
}) {
  const dbDiscs = useDiscs(discIds)
  const { database } = useDatabaseContext()
  const effectiveStats = useMemo(
    () => getMergedEffectiveStats(characterKey, database),
    [characterKey, database]
  )
  const substatWeights = useMemo(
    () => getMergedSubstatWeights(characterKey, database),
    [characterKey, database]
  )
  const openEditorModal = useDiscEditorModalStore((s) => s.openOverlay)

  const discs = useMemo(() => {
    if (!theoreticalDiscMap) return dbDiscs
    return Object.fromEntries(
      allDiscSlotKeys.map((slot) => {
        const id = discIds[slot]
        if (id && theoreticalDiscMap[id]) return [slot, theoreticalDiscMap[id]]
        return [slot, dbDiscs[slot]]
      })
    ) as Record<DiscSlotKey, ICachedDisc | undefined>
  }, [dbDiscs, discIds, theoreticalDiscMap])

  const handleDiscClick = useCallback(
    (slot: DiscSlotKey) => {
      const disc = discs[slot]
      openEditorModal({
        selectedDisc: disc ?? null,
        slotKey: slot,
        characterKey,
        onOk: () => {},
      })
    },
    [discs, openEditorModal, characterKey]
  )

  return (
    <Flex
      gap={6}
      wrap="nowrap"
      style={
        {
          '--showcase-card-bg': 'var(--mantine-color-dark-6)',
          '--showcase-card-border': 'rgba(255, 255, 255, 0.1)',
          '--showcase-shadow': 'rgba(0, 0, 0, 0.25) 0px 2px 16px',
          '--showcase-shadow-inset':
            ', inset rgba(255, 255, 255, 0.1) 0px 0px 2px',
        } as any
      }
    >
      {allDiscSlotKeys.map((slotKey) => (
        <ShowcaseDiscCard
          key={slotKey}
          slot={slotKey}
          disc={discs[slotKey]}
          onClick={() => handleDiscClick(slotKey)}
          effectiveStats={effectiveStats}
          substatWeights={substatWeights}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: `${discCardW} / ${discCardH}`,
          }}
        />
      ))}
    </Flex>
  )
}

/**
 * Aggregate summary card for theoretical max builds.
 * Shows total substat rolls and main stat selections across all 6 discs,
 * using the recipe's metadata (total rolls per substat across all discs)
 * instead of per-disc substat arrays (which can't capture all substat
 * types when different discs have different sets).
 */
function TheoreticalBuildSummary({
  recipeId,
  recipeMeta,
  theoreticalDiscMap,
  value,
  isPinned,
  pinnedRecipeId,
  onPinReference,
}: {
  recipeId: string
  recipeMeta?: BuildRecipe
  theoreticalDiscMap: Record<string, ICachedDisc>
  value: number
  isPinned: boolean
  pinnedRecipeId?: string
  onPinReference: (build?: GeneratedBuild) => void
}) {
  const allDiscs = allDiscSlotKeys
    .map((sk) => theoreticalDiscMap[`${recipeId}_${sk}`])
    .filter(Boolean) as ICachedDisc[]

  // Collect main stat per slot
  const mainStatBySlot: Record<DiscSlotKey, string> = {} as Record<
    DiscSlotKey,
    string
  >
  for (const d of allDiscs) {
    mainStatBySlot[d.slotKey] = d.mainStatKey
  }

  // Use recipe metadata totalRolls for aggregate display
  const substatEntries = recipeMeta
    ? Object.entries(recipeMeta.totalRolls)
        .filter(([, rolls]) => (rolls ?? 0) > 0)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    : []
  // Only the exact pinned recipe counts as pinned — value ties (e.g. crit_
  // vs crit_dmg_ mains) surface sibling builds that must stay pinnable.
  const isThisPinned = isPinned && pinnedRecipeId === recipeId

  return (
    <Box p="sm">
      <Flex align="center" justify="space-between" gap="xs" mb="xs">
        <Text size="lg" fw={700} c="yellow">
          Build Value: {Math.floor(value).toLocaleString()}
        </Text>
        <Button
          size="xs"
          variant={isThisPinned ? 'filled' : 'default'}
          disabled={isThisPinned}
          onClick={() => onPinReference()}
          title={
            isThisPinned
              ? 'This build is the pinned reference for this character'
              : isPinned
                ? 'This character already has a pinned reference — pinning this build replaces it'
                : 'Pin this theoretical build as this character\u2019s perfect reference for future comparisons'
          }
        >
          {isThisPinned ? 'Reference pinned' : 'Pin as reference'}
        </Button>
      </Flex>

      <Text size="sm" fw={600} mt="sm" mb={4}>
        Main Stats
      </Text>
      <Flex gap="xs" wrap="wrap">
        {allDiscSlotKeys.map((sk) => (
          <Text key={sk} size="xs" c="dimmed">
            Slot {sk}: {statMainLabel(mainStatBySlot[sk] ?? '')}
          </Text>
        ))}
      </Flex>

      <Text size="sm" fw={600} mt="sm" mb={4}>
        Total Substats (across all 6 discs)
      </Text>
      <Flex gap="xs" wrap="wrap">
        {substatEntries.length > 0 ? (
          substatEntries.map(([key, totalRolls]) => {
            const perRoll = getDiscSubStatBaseVal(key as DiscSubStatKey, 'S')
            const totalVal = perRoll * (totalRolls ?? 0)
            // Percentage substats: hp_, atk_, def_, crit_, crit_dmg_, pen_
            const isPercent = [
              'hp_',
              'atk_',
              'def_',
              'crit_',
              'crit_dmg_',
              'pen_',
            ].includes(key)
            const formatted = isPercent
              ? (totalVal * 100).toFixed(1) + '%'
              : Math.round(totalVal).toString()
            return (
              <Text key={key} size="xs">
                {statShortLabel(key)}: {formatted} ({totalRolls} roll
                {totalRolls !== 1 ? 's' : ''})
              </Text>
            )
          })
        ) : (
          <Text size="xs" c="dimmed">
            Value: {Math.floor(value).toLocaleString()}
          </Text>
        )}
      </Flex>

      {recipeMeta && (
        <>
          <Text size="sm" fw={600} mt="sm" mb={4}>
            Sets
          </Text>
          <Stack gap={4}>
            {/* 4-Piece set */}
            <Flex gap="xs" align="center">
              <Text size="xs" fw={500}>
                <DiscSetName setKey={recipeMeta.set4} />
              </Text>
              <Text size="xs" c="dimmed">
                4pc
              </Text>
            </Flex>
            {/* 2-Piece set */}
            {recipeMeta.set4 !== recipeMeta.set2 && (
              <Flex gap="xs">
                <Text size="xs" c="dimmed">
                  2pc:
                </Text>
                <Text size="xs">
                  <DiscSet2p setKey={recipeMeta.set2} />
                </Text>
              </Flex>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

function statMainLabel(key: string): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'ATK',
    def: 'DEF',
    hp_: 'HP%',
    atk_: 'ATK%',
    def_: 'DEF%',
    crit_: 'CRIT Rate',
    crit_dmg_: 'CRIT DMG',
    pen_: 'PEN Ratio',
    anomProf: 'Anom Prof',
    anomMas_: 'Anom Mas',
    impact_: 'Impact',
    enerRegen_: 'Energy Regen',
    physical_dmg_: 'Phys DMG',
    fire_dmg_: 'Fire DMG',
    ice_dmg_: 'Ice DMG',
    electric_dmg_: 'Elec DMG',
    ether_dmg_: 'Ether DMG',
    wind_dmg_: 'Wind DMG',
  }
  return labels[key] ?? key
}

/**
 * GPU tuning knobs read from the URL (?wg=512&cycles=512&f16=1&chunks=2),
 * for A/B testing the WebGPU solver without rebuilding. Parsed from both the
 * query string and the hash fragment (the app routes in the hash). Absent
 * params fall back to the proven defaults (256/256, f32, 4 target chunks).
 */
function getGpuTuningParams(): WebGpuSolverOptions {
  const q = new URLSearchParams(window.location.search)
  const hashQ = window.location.hash.split('?')[1]
  if (hashQ)
    for (const [k, v] of new URLSearchParams(hashQ)) if (!q.has(k)) q.set(k, v)
  const wg = q.get('wg')
  const cycles = q.get('cycles')
  const f16 = q.get('f16')
  const db = q.get('db')
  const chunks = q.get('chunks')
  const chunkms = q.get('chunkms')
  const cal = q.get('cal')
  return {
    ...(wg ? { workgroupSize: Number(wg) } : {}),
    ...(cycles ? { cyclesPerInvocation: Number(cycles) } : {}),
    ...(f16 ? { f16: f16 === '1' || f16 === 'true' } : {}),
    ...(db ? { doubleBuffer: db === '1' || db === 'true' } : {}),
    ...(chunks ? { targetChunks: Number(chunks) } : {}),
    ...(chunkms ? { chunkMs: Number(chunkms) } : {}),
    ...(cal ? { calibrate: cal === '1' || cal === 'true' } : {}),
  }
}

function statShortLabel(key: string): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'ATK',
    def: 'DEF',
    hp_: 'HP%',
    atk_: 'ATK%',
    def_: 'DEF%',
    crit_: 'CR',
    crit_dmg_: 'CD',
    pen: 'PEN',
    anomProf: 'AP',
  }
  return labels[key] ?? key
}

/**
 * Recover a recipe's index from its id (`recipe_123` -> `123`). Recipe ids are
 * assigned in enumeration order, which is exactly the compact descriptor
 * index, so the id alone is enough to rebuild the recipe's metadata.
 */
function recipeIndexFromId(recipeId: string): number | undefined {
  if (!recipeId.startsWith('recipe_')) return undefined
  const index = Number(recipeId.slice('recipe_'.length))
  return Number.isInteger(index) && index >= 0 ? index : undefined
}

/**
 * Create 6 fake ICachedDisc objects from a recipe for stat computation.
 * The formula's discsToTagMapNodeEntries accumulates stats across all
 * discs, so we create one disc per slot with the correct main stat and
 * set assignment. Substats come from the recipe's per-disc assignment
 * (which never duplicates a disc's main stat). The substats must be
 * preserved verbatim — dropping any would make the displayed stats
 * diverge from the values the solver constrained on.
 */
function createRecipeDiscs(
  recipe: BuildRecipe,
  recipeId: string
): ICachedDisc[] {
  const base = (
    slotKey: DiscSlotKey,
    mainStatKey: DiscMainStatKey,
    setKey: DiscSetKey
  ): ICachedDisc => ({
    id: `${recipeId}_${slotKey}`,
    setKey,
    slotKey,
    level: 15,
    rarity: 'S' as const,
    mainStatKey,
    substats: [],
    location: '',
    lock: false,
    trash: false,
  })

  const slotKeys: DiscSlotKey[] = ['1', '2', '3', '4', '5', '6']

  return slotKeys.map((slotKey, discIdx) => {
    const mainStatKey = recipe.mainStats[slotKey]
    const setKey =
      slotKey === '4' || slotKey === '1' || slotKey === '2' || slotKey === '3'
        ? recipe.set4
        : recipe.set2

    const substats = recipe.perDiscSubstats?.[discIdx] ?? []

    return {
      ...base(slotKey, mainStatKey, setKey),
      substats,
    }
  })
}

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
  const [numWorkers] = useState(() =>
    Math.min(navigator.hardwareConcurrency || 4, 8)
  )
  const [progress, setProgress] = useState<SolverProgress | undefined>(
    undefined
  )
  const { optConfig, optConfigId } = useContext(OptConfigContext)
  // WebGPU is the default engine (the config schema already defaults to 'gpu').
  // A browser that cannot run it must fall back to the CPU solver instead of
  // silently producing an empty result grid, so resolve the effective engine
  // here rather than trusting the stored value.
  const requestedEngine = optConfig.engine ?? 'gpu'
  const gpuAvailable =
    typeof navigator !== 'undefined' &&
    !!(navigator as Navigator & { gpu?: unknown }).gpu
  const engine: OptimizerEngine =
    requestedEngine === 'gpu' && !gpuAvailable ? 'cpu' : requestedEngine
  useEffect(() => {
    if (requestedEngine === 'gpu' && !gpuAvailable)
      console.warn(
        '[Optimize] WebGPU is unavailable in this browser; using the CPU solver.'
      )
  }, [requestedEngine, gpuAvailable])
  const setEngine = useCallback(
    (engine: OptimizerEngine) => {
      if (optConfigId) database.optConfigs.set(optConfigId, { engine })
    },
    [optConfigId, database]
  )
  const statFiltersRef = useRef<StatFilters>(optConfig.statFilters ?? [])
  const discs = useDataManagerValues(database.discs)

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
  const clearPinnedBuilds = useOptimizerDisplayStore((s) => s.clearPinnedBuilds)
  const pinnedBuilds = useOptimizerDisplayStore((s) => s.pinnedBuilds)
  const addPinnedBuild = useOptimizerDisplayStore((s) => s.addPinnedBuild)
  const removePinnedBuild = useOptimizerDisplayStore((s) => s.removePinnedBuild)

  // Theoretical max mode toggle (local state to avoid OptConfig re-render cascade)
  const [useTheoreticalMax, setUseTheoreticalMax] = useState(false)

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

  // Stat display toggle (combat vs basic stats in grid)
  const [statDisplay, setStatDisplay] = useState<StatDisplay>('combat')

  const discsBySlot = useMemo(() => {
    const slotKeyMap = {
      4: optConfig.slot4,
      5: optConfig.slot5,
      6: optConfig.slot6,
    } as const
    const isFilteredSlot = (slotKey: DiscSlotKey): slotKey is '4' | '5' | '6' =>
      ['4', '5', '6'].includes(slotKey)

    // Get custom sort order for priority checking
    // When empty, all characters have equal priority (no filtering)
    const displayCharacter = database.displayCharacter.get()
    const customSortOrder = displayCharacter?.customSortOrder ?? []

    return discs.reduce(
      (discsBySlot, disc) => {
        const { slotKey, mainStatKey, level, location } = disc
        if (level < optConfig.levelLow || level > optConfig.levelHigh)
          return discsBySlot

        // Existing logic: exclude if useEquipped is false
        if (location && !optConfig.useEquipped && location !== characterKey)
          return discsBySlot

        // Priority-based filtering: exclude discs from higher-priority characters
        if (
          location &&
          optConfig.useEquipped &&
          optConfig.useCharacterPriority &&
          location !== characterKey
        ) {
          // Check if disc owner has higher priority
          if (hasHigherPriority(location, characterKey, customSortOrder)) {
            return discsBySlot
          }
        }

        // When no main stat is selected for a slot (empty array),
        // behave as if all main stats are allowed.
        if (
          isFilteredSlot(slotKey) &&
          slotKeyMap[slotKey].length > 0 &&
          !slotKeyMap[slotKey].includes(mainStatKey)
        )
          return discsBySlot
        discsBySlot[disc.slotKey].push(disc)
        return discsBySlot
      },
      {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
      } as Record<DiscSlotKey, ICachedDisc[]>
    )
  }, [
    optConfig.slot4,
    optConfig.slot5,
    optConfig.slot6,
    optConfig.levelLow,
    optConfig.levelHigh,
    optConfig.useEquipped,
    optConfig.useCharacterPriority,
    discs,
    characterKey,
    database.displayCharacter,
  ])
  const allWengineData = useDataManagerValues(database.wengines)
  const filteredWengineKeys = useMemo(() => {
    if (!optConfig.optWengine) {
      return character.wengineKey ? [character.wengineKey] : []
    }
    return allWengineData
      .filter(({ key }) => {
        const { type } = getWengineStat(key)
        return optConfig.wEngineTypes.includes(type)
      })
      .map(({ key }) => key)
  }, [
    character.wengineKey,
    allWengineData,
    optConfig.optWengine,
    optConfig.wEngineTypes,
  ])

  // Compute filtered discs per slot based on active set filters.
  // When set filters are active, only discs from the selected sets
  // contribute to the permutation estimate shown to the user.
  const filteredDiscsBySlot = useMemo(() => {
    const activeSetKeys = new Set([
      ...(optConfig.setFilter2 ?? []),
      ...(optConfig.setFilter4 ?? []),
    ])
    if (!activeSetKeys.size) return discsBySlot
    return Object.fromEntries(
      Object.entries(discsBySlot).map(([slot, discs]) => [
        slot,
        discs.filter((d) => activeSetKeys.has(d.setKey)),
      ])
    ) as Record<DiscSlotKey, ICachedDisc[]>
  }, [discsBySlot, optConfig.setFilter2, optConfig.setFilter4])

  // Total permutations (unfiltered, used for progress calculation only).
  // The solver searches the full disc space; progress tracks actual builds
  // searched against this total, NOT against the filtered count.
  const totalPermutations = useMemo(
    () => buildCount(Object.values(discsBySlot)) * filteredWengineKeys.length,
    [filteredWengineKeys.length, discsBySlot]
  )

  // Filtered permutation count (displayed in sidebar — reflects set filters).
  // This gives a lower-bound estimate of how many builds satisfy the filters.
  const filteredPermutations = useMemo(
    () =>
      buildCount(Object.values(filteredDiscsBySlot)) *
      filteredWengineKeys.length,
    [filteredWengineKeys.length, filteredDiscsBySlot]
  )

  // Update sidebar permutation details:
  // - count: number of discs per slot AFTER all active filters (filteredDiscsBySlot)
  // - total: number of discs per slot BEFORE any filters (raw from all discs)
  // This way the PermutationDisplay shows the filter reduction ratio
  // (e.g. slot 5 with Pen Ratio filter might show 1/13 - 8%).
  useEffect(() => {
    // Compute raw per-slot counts from all discs (no filters applied)
    const rawCounts: Record<string, number> = {}
    for (const disc of discs) {
      rawCounts[disc.slotKey] = (rawCounts[disc.slotKey] ?? 0) + 1
    }
    const details: Record<string, { count: number; total: number }> = {}
    for (const [slot, slotDiscs] of Object.entries(filteredDiscsBySlot)) {
      details[slot] = {
        count: slotDiscs.length,
        total: rawCounts[slot] ?? 0,
      }
    }
    setPermutationDetails(details)
    setPermutations(filteredPermutations)
  }, [
    discs,
    filteredDiscsBySlot,
    filteredPermutations,
    setPermutationDetails,
    setPermutations,
  ])

  const [optimizing, setOptimizing] = useState(false)
  const [sortTrigger, setSortTrigger] = useState(0)

  const onResultLimitChange = useCallback(
    (limit: number) => {
      database.optConfigs.set(optConfigId, {
        maxBuildsToShow: limit as (typeof maxBuildsToShowList)[number],
      })
    },
    [database.optConfigs, optConfigId]
  )

  const cancelToken = useRef(() => {})
  useEffect(() => () => cancelToken.current(), [])

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
      const frames = getComboFrames(team)
        .filter((frame) => frame.tag)
        .map((frame) => ({
          tag: targetTag(frame.tag!),
          multiplier: frame.multiplier,
        }))
      if (frames.length === 0)
        frames.push({ tag: targetTag(target), multiplier: 1 })

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
        let debugTargets: Partial<Record<DiscSubStatKey, number>> | undefined
        try {
          const raw = localStorage.getItem('zz_debug_substat_targets')
          if (raw) {
            debugTargets = JSON.parse(raw)
            console.warn(
              '[TheoreticalMax] DEBUG substat roll targets active:',
              debugTargets
            )
          }
        } catch {
          // ignore parse errors
        }
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
        recipeMetaRef.current = (recipeId: string) => {
          const index = recipeIndexFromId(recipeId)
          return index === undefined
            ? undefined
            : materializeRecipeFromIndex(
                index,
                pipeline.recipeIndex,
                pipeline.context
              )
        }
        // Start with empty disc map; we populate it after the solver returns
        // with only the recipes that end up in the final build results
        activeDiscMap = {}

        // Update sidebar with recipe counts. These report the full generated
        // space, not just what survived pruning — that is what the search space
        // is measured in, and the pruned pool size is logged above.
        setPermutations(pipeline.totalRecipes * filteredWengineKeys.length)
        const details: Record<string, { count: number; total: number }> = {}
        for (const slotKey of allDiscSlotKeys) {
          details[slotKey] = {
            count: pipeline.totalRecipes,
            total: pipeline.totalRecipes,
          }
        }
        setPermutationDetails(details)
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
      if (results.length > optConfig.maxBuildsToShow) {
        results = results.slice(0, optConfig.maxBuildsToShow)
      }
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
      const storedBuilds = results
        .map(({ ids, value }) => {
          // Recipe builds: the solver stores the recipe ID (e.g. 'recipe_0')
          // in slot 1. We need to expand it to per-slot disc IDs
          // ('recipe_0_1', 'recipe_0_2', etc.) so the stat computation
          // and display can find the fake discs in theoreticalDiscMap.
          const recipeId =
            ids[1] && String(ids[1]).startsWith('recipe_')
              ? String(ids[1])
              : undefined
          return {
            wengineKey: ids[0],
            discIds: objKeyMap(allDiscSlotKeys, (slot, _index) =>
              recipeId ? `${recipeId}_${slot}` : ids[_index + 1]
            ),
            value,
          }
        })
        // Deduplicate by wengine + disc combination — the solver may
        // return the same build through different search paths, especially
        // in theoretical max mode with a constrained disc pool.
        .filter(
          (() => {
            const seen = new Set<string>()
            return (build: {
              wengineKey?: string
              discIds: { [key: string]: string | undefined }
            }) => {
              const id = `${build.wengineKey ?? ''}-${Object.values(build.discIds).join('-')}`
              if (seen.has(id)) return false
              seen.add(id)
              return true
            }
          })()
        )
        // Re-sort by value descending — the dedup filter preserves insertion
        // order but removing entries can leave the array unsorted if the
        // solver's ordering had holes from worker-level pruning.
        .sort((a, b) => b.value - a.value)

      // After solver returns, create disc objects only for the returned
      // builds (avoids OOM from pre-creating discs for ALL recipes).
      // The recipeMetaRef stores the full recipe metadata needed to
      // reconstruct disc objects for any recipe on demand.
      if (useTheoreticalMax) {
        const returnedDiscMap: Record<string, ICachedDisc> = {}
        for (const build of storedBuilds) {
          const rid = build.discIds['1']?.replace(/_\d+$/, '')
          const recipe = rid ? recipeMetaRef.current(rid) : undefined
          if (rid && recipe) {
            const discs = createRecipeDiscs(recipe, rid)
            for (const disc of discs) {
              returnedDiscMap[disc.id] = disc
            }
          }
        }
        activeDiscMap = returnedDiscMap
        theoreticalDiscMapRef.current = returnedDiscMap
        setTheoreticalDiscMap(returnedDiscMap)
      }

      database.optConfigs.newOrSetGeneratedBuildList(optConfigId, {
        builds: storedBuilds,
        buildDate: Date.now(),
      })
      setPermutationsResults(results.length)
      setSortTrigger((g) => g + 1)
    },
    [
      calc,
      target,
      team,
      statFiltersRef,
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
    if (isNewResultSet) {
      const builds = generatedBuildList?.builds ?? []
      setSelectedBuild(
        useTheoreticalMax && builds.length > 0 ? builds[0] : equippedBuild
      )
      return
    }
    // Same result set: keep the selection if the build still exists,
    // otherwise fall back to the equipped build.
    setSelectedBuild((current) => {
      if (
        current &&
        allBuilds.some((b) => buildRowId(b) === buildRowId(current))
      ) {
        return current
      }
      return equippedBuild
    })
  }, [
    resultIdentity,
    generatedBuildList?.builds,
    allBuilds,
    equippedBuild,
    useTheoreticalMax,
  ])

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
        buildDate: generatedBuildList?.buildDate ?? Date.now(),
      })
    })
  }, [
    allBuilds,
    character,
    team,
    database,
    optConfigId,
    generatedBuildList?.buildDate,
  ])

  // Pin/unpin the currently selected build from the sidebar Pin button
  const onPin = useCallback(() => {
    if (!selectedBuild) return
    const buildId = buildRowId(selectedBuild)
    if (pinnedBuilds.some((b) => b.buildId === buildId)) {
      removePinnedBuild(buildId)
    } else {
      const buildIndex = allBuilds.findIndex((b) => buildRowId(b) === buildId)
      addPinnedBuild({
        buildId,
        index: buildIndex, // -1 for equipped build → displayed as #0
        value: selectedBuild.value,
        wengineKey: selectedBuild.wengineKey,
        discIds: selectedBuild.discIds,
      })
    }
  }, [
    selectedBuild,
    pinnedBuilds,
    allBuilds,
    addPinnedBuild,
    removePinnedBuild,
  ])

  // Pin the currently selected theoretical build as this character's perfect
  // reference. Must use the selection — not sorted[0] — because ties on
  // build value (e.g. crit_ vs crit_dmg_ mains with equal value) surface
  // multiple equivalent rows and the user may pick any of them.
  const onPinReference = useCallback(
    (build?: GeneratedBuild) => {
      const toPin = build ?? selectedBuild
      if (!toPin?.discIds?.['1']?.startsWith('recipe_')) {
        console.warn('[TheoReference] nothing to pin')
        return
      }
      const rid = toPin.discIds['1']?.replace(/_\d+$/, '')
      const bestRecipe = rid ? recipeMetaRef.current(rid) : undefined
      if (!rid || !bestRecipe) {
        console.warn('[TheoReference] could not resolve theoretical recipe')
        return
      }
      const profile = buildReferenceProfile(bestRecipe)
      // Prefer the display-canonical recomputed value for the pinned build, so
      // the reference matches what the Analysis panel computes for that exact
      // build (the solver's raw value can be off by float rounding).
      const refValue =
        enrichedValuesRef.current.get(buildRowId(toPin)) ?? toPin.value
      if (!(refValue > 0)) {
        console.warn('[TheoReference] nothing to pin')
        return
      }
      const snapshot = buildTheoContextSnapshot(
        target,
        optConfig.setFilter2,
        optConfig.setFilter4
      )
      // Materialize the selected build with stable ids so it survives a
      // page refresh (the generator's recipe index lives only in memory).
      // Re-pinning overwrites the same ids.
      const refIdPrefix = `theoref_${characterKey}`
      const referenceDiscs = createRecipeDiscs(bestRecipe, refIdPrefix)
      const refWengineKey = toPin.wengineKey
      // In-combat snapshot of the reference build under the current team, so
      // the comparison panel can show stats without a live calculator.
      // getDisc must resolve teammate discs too — team-wide set bonuses and
      // buffs scaling off teammate gear (e.g. team CRIT DMG) are otherwise
      // silently dropped from the snapshot.
      let referenceCombatStats = undefined as
        | TheoReference['referenceCombatStats']
        | undefined
      try {
        const refDiscMap = Object.fromEntries(
          referenceDiscs.map((d) => [d.slotKey, d])
        ) as Record<DiscSlotKey, ICachedDisc | undefined>
        const refCharacter =
          refWengineKey !== undefined
            ? ({ ...character, wengineKey: refWengineKey } as typeof character)
            : character
        const refFormulaTag = isComboTarget(target)
          ? getComboFrames(team)
              .filter((frame) => frame.tag?.sheet && frame.tag?.name)
              .map((frame) => ({
                tag: targetTag(frame.tag!),
                multiplier: frame.multiplier,
              }))
          : target
            ? targetTag(target)
            : undefined
        const getDisc = (id: string) =>
          theoreticalDiscMapRef.current[id] ??
          database.discs.get(id) ??
          undefined
        const computed = computeBuildStats(
          refCharacter,
          refDiscMap,
          team,
          refFormulaTag,
          (key) => database.chars.get(key) ?? undefined,
          getDisc
        )
        referenceCombatStats = { ...computed.final }
      } catch (e) {
        console.warn('[TheoReference] combat snapshot failed:', e)
      }
      database.theoReferences.pin(characterKey, {
        value: refValue,
        perfectRolls: profile.perfectRolls,
        mainsBySlot: profile.mainsBySlot,
        set4: bestRecipe.set4,
        set2: bestRecipe.set2,
        wengineKey: refWengineKey,
        ...snapshot,
        date: Date.now(),
        bestRecipe,
        referenceDiscs,
        ...(referenceCombatStats ? { referenceCombatStats } : {}),
      })
      console.log('[TheoReference] pinned', refValue, 'for', characterKey)
    },
    [
      selectedBuild,
      database,
      character,
      characterKey,
      target,
      team,
      optConfig.setFilter2,
      optConfig.setFilter4,
    ]
  )

  // Hydrate the in-memory theoretical disc map from the persisted reference
  // build. The generator's recipe index does not survive a refresh, so
  // without this the pinned build's discs would be unresolvable after one.
  useEffect(() => {
    const discs = pinnedReference?.referenceDiscs
    if (!discs || discs.length === 0) return
    const missing = discs.some((d) => !theoreticalDiscMapRef.current[d.id])
    if (!missing) return
    const next = { ...theoreticalDiscMapRef.current }
    for (const d of discs) next[d.id] = d
    theoreticalDiscMapRef.current = next
    setTheoreticalDiscMap(next)
  }, [pinnedReference])

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
    const { tag: target } = getTeamFrame0(team)
    const formulaTag = isComboTarget(target)
      ? getComboFrames(team)
          .filter((frame) => frame.tag?.sheet && frame.tag?.name)
          .map((frame) => ({
            tag: targetTag(frame.tag!),
            multiplier: frame.multiplier,
          }))
      : target
        ? targetTag(target)
        : undefined

    let cancelled = false
    setIsComputingStats(true)

    const getDisc = (id: string) =>
      theoreticalDiscMapRef.current[id] ?? database.discs.get(id) ?? undefined

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
  }, [buildsForStats, character, team, database, theoreticalDiscMap])

  // Analysis data for the ExpandedDataPanel
  const analysisData = useMemo((): AnalysisData | null => {
    if (!selectedBuild || !team) return null
    const getDisc = (id: string) =>
      theoreticalDiscMapRef.current[id] ?? database.discs.get(id) ?? undefined
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
            buildTheoContextSnapshot(
              target,
              optConfig.setFilter2,
              optConfig.setFilter4
            )
          ),
          weights: getMergedSubstatWeights(characterKey, database),
          set4: pinnedReference.set4,
          set2: pinnedReference.set2,
          wengineKey: pinnedReference.wengineKey,
          combatStats: pinnedReference.referenceCombatStats,
        }
      : null
    return buildAnalysisData({
      selectedBuild,
      enrichedBuilds,
      equippedBuildId,
      getDisc,
      team,
      character,
      getTeammateChar: (key) => database.chars.get(key) ?? undefined,
      reference,
    })
  }, [
    selectedBuild,
    enrichedBuilds,
    equippedBuild,
    team,
    character,
    database,
    pinnedReference,
    target,
    optConfig.setFilter2,
    optConfig.setFilter4,
    characterKey,
  ])

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
          {selectedBuild &&
            (() => {
              const recipeId = (selectedBuild.discIds?.['1'] ?? '').replace(
                /_\d+$/,
                ''
              )
              const recipeMeta = recipeId
                ? recipeMetaRef.current(recipeId)
                : undefined
              // Prefer the recomputed enriched value (correct for the
              // equipped build, whose stored value is 0) over the stale
              // `selectedBuild.value`.
              const displayValue =
                enrichedBuilds.find((b) => b.id === buildRowId(selectedBuild))
                  ?.value ?? selectedBuild.value
              return (
                <Box
                  style={{
                    borderRadius: 6,
                    padding: 8,
                    backgroundColor: 'var(--mantine-color-dark-6)',
                    border: '1px solid var(--mantine-color-dark-4)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  {useTheoreticalMax &&
                  selectedBuild.discIds['1']?.startsWith('recipe_') ? (
                    <TheoreticalBuildSummary
                      recipeId={recipeId}
                      recipeMeta={recipeMeta}
                      theoreticalDiscMap={theoreticalDiscMap}
                      value={displayValue}
                      isPinned={!!pinnedReference}
                      pinnedRecipeId={pinnedReference?.bestRecipe?.id}
                      onPinReference={onPinReference}
                    />
                  ) : (
                    <>
                      <Text size="sm" fw={500} mb="xs">
                        {t('grid.selectedBuild', 'Selected Build')} —{' '}
                        {Math.floor(displayValue).toLocaleString()}
                      </Text>
                      <SelectedBuildDiscs
                        discIds={selectedBuild.discIds}
                        characterKey={characterKey}
                        theoreticalDiscMap={theoreticalDiscMap}
                      />
                    </>
                  )}
                </Box>
              )
            })()}

          {/* Optimization Results Analysis */}
          <DeferCreate>
            <ExpandedDataPanel analysisData={analysisData} />
          </DeferCreate>
        </Stack>

        {/* ─── Right Column: Sticky Sidebar (233px) ─── */}
        {!isMobileLayout && (
          <DeferCreate>
            <Box
              style={{
                position: 'sticky',
                top: 80,
                width: 233,
                alignSelf: 'flex-start',
                flexShrink: 0,
              }}
            >
              <Box
                style={{
                  borderRadius: 6,
                  backgroundColor: 'var(--layer-2)',
                  padding: 16,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <Stack gap={5}>
                  <PermutationsSection isFullSize={true} />
                  <OptimizerControlsSection
                    isFullSize={true}
                    optimizing={optimizing}
                    total={totalPermutations}
                    hasTarget={!!target}
                    statDisplay={statDisplay}
                    useTheoreticalMax={useTheoreticalMax}
                    engine={engine}
                    resultLimit={optConfig.maxBuildsToShow}
                    onEngineChange={setEngine}
                    onOptimize={onOptimize}
                    onCancel={onCancel}
                    onReset={onReset}
                    onResultLimitChange={onResultLimitChange}
                    onStatDisplayChange={setStatDisplay}
                  />
                  <ResultsSection
                    isFullSize={true}
                    onEquip={onEquip}
                    onFilter={onFilter}
                    onPin={onPin}
                    onClearPins={onClearPins}
                  />
                  <BuildsSection
                    isFullSize={true}
                    selectedBuild={selectedBuild}
                    characterKey={characterKey}
                  />
                </Stack>
              </Box>
            </Box>
          </DeferCreate>
        )}
      </Flex>

      {/* Mobile bottom bar */}
      {isMobileLayout && (
        <ResponsiveBottomBar
          optimizing={optimizing}
          total={totalPermutations}
          useTheoreticalMax={useTheoreticalMax}
          onOptimize={onOptimize}
          onCancel={onCancel}
          onReset={onReset}
        />
      )}

      {/* Disc editor modal (global, opened by clicking disc cards) */}
      <DiscEditorModal />
    </DeferCreateProvider>
  )
}
