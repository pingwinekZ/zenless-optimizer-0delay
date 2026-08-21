import { Box, Flex, Loader, Stack, Text } from '@mantine/core'
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
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
  PhaseKey,
} from '../../consts'
import { allDiscSlotKeys, getDiscSubStatBaseVal } from '../../consts'
import {
  type DiscIds,
  type GeneratedBuild,
  getTeamFrame0,
  type ICachedDisc,
  type maxBuildsToShowList,
  type OptimizerEngine,
  type StatFilters,
  targetTag,
} from '../../db'
import {
  OptConfigContext,
  OptConfigProvider,
  useCharacterContext,
  useDatabaseContext,
  useDiscs,
  useTeam,
} from '../../db-ui'
import { useZzzCalcContext } from '../../formula-ui'
import { ShowcaseDiscCard } from '../../page-characters'
import { discCardH, discCardW } from '../../page-characters/constantsUi'
import {
  type BuildRecipe,
  createSolverConfig,
  generateTheoreticalDiscs,
} from '../../solver'
import { getCharStat, getWengineStat } from '../../stats'
import { DiscEditorModal, useDiscEditorModalStore } from '../../ui'
import { DiscSet2p, DiscSetName } from '../../ui/Disc/DiscTrans'
import { getCharacterEffectiveStats, hasHigherPriority } from '../../util'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { buildAnalysisData } from '../Analysis/ExpandedDataPanelController'
import { BuildsSection } from '../BuildManagement'
import { useResponsive } from '../hooks'
import { ResponsiveBottomBar } from '../layout'
import type { StatDisplay } from '../Sidebar'
import {
  OptimizerControlsSection,
  PermutationsSection,
  ResultsSection,
} from '../Sidebar'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import type { EnrichedBuild } from '../Util/buildStatsUtils'
import {
  batchComputeBuildStats,
  buildRowId,
  filterBuildsByStatFilters,
} from '../Util/buildStatsUtils'
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
  const effectiveStats = useMemo(
    () => getCharacterEffectiveStats(characterKey),
    [characterKey]
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
}: {
  recipeId: string
  recipeMeta?: BuildRecipe
  theoreticalDiscMap: Record<string, ICachedDisc>
  value: number
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

  return (
    <Box p="sm">
      <Text size="lg" fw={700} c="yellow" mb="xs">
        Build Value: {Math.floor(value).toLocaleString()}
      </Text>

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
  const engine = optConfig.engine ?? 'cpu'
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
  const [theoreticalDiscMap, setTheoreticalDiscMap] = useState<
    Record<string, ICachedDisc>
  >({})
  // Recipe metadata for TheoreticalBuildSummary display
  const recipeMetaRef = useRef<Record<string, BuildRecipe>>({})

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
  const [sortByKey, setSortByKey] = useState<string | undefined>(undefined)
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
        wenginePhase: 1,
      })
    },
    [database.chars, characterKey]
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

      const statFilters = (statFiltersRef.current ?? []).filter(
        (s) => !s.disabled
      )
      const frames = target.rotation
        ? target.rotation.map(({ sheet, name }) => ({
            tag: targetTag({ sheet, name }),
            multiplier: 1,
          }))
        : [{ tag: targetTag(target), multiplier: 1 }]

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
        const result = generateTheoreticalDiscs(
          characterKey,
          optConfig.setFilter2,
          optConfig.setFilter4,
          {
            4: optConfig.slot4,
            5: optConfig.slot5,
            6: optConfig.slot6,
          },
          debugTargets
        )
        console.debug(
          '[TheoreticalMax] generated',
          result.recipes.length,
          'recipes',
          'map keys:',
          Object.keys(result.recipeMap).length
        )
        if (result.recipes.length === 0) {
          console.warn('[TheoreticalMax] No recipes generated!')
        } else {
          // Log first recipe stats for debugging
          const sample = result.recipes[0]
          console.debug('[TheoreticalMax] sample recipe:', sample)
        }
        activeRecipes = result.recipes
        // Store recipe metadata for display (used to reconstruct disc objects
        // for the builds the solver returns — we avoid creating disc objects
        // for ALL recipes here to prevent OOM with large recipe counts)
        recipeMetaRef.current = result.recipeMap
        // Start with empty disc map; we populate it after the solver returns
        // with only the recipes that end up in the final build results
        activeDiscMap = {}

        // Update sidebar with recipe counts
        setPermutations(result.recipes.length * filteredWengineKeys.length)
        const details: Record<string, { count: number; total: number }> = {}
        for (const slotKey of allDiscSlotKeys) {
          details[slotKey] = {
            count: result.recipes.length,
            total: result.recipes.length,
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
          if (rid && recipeMetaRef.current[rid]) {
            const recipe = recipeMetaRef.current[rid]
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
      statFiltersRef,
      useTheoreticalMax,
      database,
      optConfig.setFilter2,
      optConfig.setFilter4,
      optConfig.maxBuildsToShow,
      optConfig.slot4,
      optConfig.slot5,
      optConfig.slot6,
      characterKey,
      character.wenginePhase,
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

    // Get the optimization target formula tag from the team's first frame
    const { tag: target } = getTeamFrame0(team)
    const formulaTag = target?.rotation
      ? target.rotation.map(({ sheet, name }) => targetTag({ sheet, name }))
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
    return buildAnalysisData({
      selectedBuild,
      enrichedBuilds,
      equippedBuildId,
      getDisc,
      team,
      character,
      getTeammateChar: (key) => database.chars.get(key) ?? undefined,
    })
  }, [selectedBuild, enrichedBuilds, equippedBuild, team, character, database])

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
            sortByKey={sortByKey}
            resultLimit={optConfig.maxBuildsToShow}
            statFiltersRef={statFiltersRef}
            onCharacterChange={onCharacterChange}
            onWengineChange={onWengineChange}
            onSortByChange={setSortByKey}
            onResultLimitChange={onResultLimitChange}
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
                sortByKey={sortByKey}
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
                ? recipeMetaRef.current[recipeId]
                : undefined
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
                      value={selectedBuild.value}
                    />
                  ) : (
                    <>
                      <Text size="sm" fw={500} mb="xs">
                        {t('grid.selectedBuild', 'Selected Build')} —{' '}
                        {Math.floor(selectedBuild.value).toLocaleString()}
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
                    onEngineChange={setEngine}
                    onOptimize={onOptimize}
                    onCancel={onCancel}
                    onReset={onReset}
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
