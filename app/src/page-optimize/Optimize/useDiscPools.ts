import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { buildCount } from '@zenless-optimizer/game-opt/solver'
import type {
  CharacterKey,
  DiscSlotKey,
  WengineKey,
} from '@zenless-optimizer/zzz/consts'
import type {
  ICachedDisc,
  OptConfig,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import { useEffect, useMemo } from 'react'
import { boostDiscToPotential } from '../../page-discs/scoring/potentialDiscs'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from '../../page-discs/scoring/statWeightUtils'
import {
  buildPermutationDetails,
  filterDiscsBySets,
  filterDiscsBySlot,
  filterWengineKeys,
} from './discFiltering'

/** Inputs for the disc-pool hook — values owned by `OptimizeWrapper`. */
export type DiscPoolInputs = {
  database: ZzzDatabase
  characterKey: CharacterKey
  /** The character's equipped wengine (used by equipped-only search mode). */
  equippedWengineKey: WengineKey | '' | undefined
  optConfig: OptConfig
  /** When true, discs are evaluated at max potential (max level + remaining
   * rolls into the character's best substats), keeping original IDs. */
  usePotentialBest: boolean
  setPermutationDetails: (
    details: ReturnType<typeof buildPermutationDetails>
  ) => void
  setPermutations: (n: number) => void
}

/**
 * The optimizer's search space: discs grouped and filtered by slot, the
 * wengine keys to sweep, and the permutation counts the sidebar reports.
 * Owns both data-manager subscriptions and the sidebar-details effect.
 * Verbatim move from `Optimize/index.tsx`.
 */
export function useDiscPools(inputs: DiscPoolInputs) {
  const {
    database,
    characterKey,
    equippedWengineKey,
    optConfig,
    usePotentialBest,
    setPermutationDetails,
    setPermutations,
  } = inputs

  const discs = useDataManagerValues(database.discs)
  const allWengineData = useDataManagerValues(database.wengines)

  // Get custom sort order for priority checking
  // When empty, all characters have equal priority (no filtering)
  const customSortOrder = useMemo(
    () => database.displayCharacter.get()?.customSortOrder ?? [],
    [database.displayCharacter]
  )

  const discsBySlot = useMemo(
    () =>
      filterDiscsBySlot(discs, {
        levelLow: optConfig.levelLow,
        levelHigh: optConfig.levelHigh,
        useEquipped: optConfig.useEquipped,
        useCharacterPriority: optConfig.useCharacterPriority,
        slot4: optConfig.slot4,
        slot5: optConfig.slot5,
        slot6: optConfig.slot6,
        characterKey,
        customSortOrder,
      }),
    [
      optConfig.slot4,
      optConfig.slot5,
      optConfig.slot6,
      optConfig.levelLow,
      optConfig.levelHigh,
      optConfig.useEquipped,
      optConfig.useCharacterPriority,
      discs,
      characterKey,
      customSortOrder,
    ]
  )

  // Potentially-best view: same pools, but each disc is boosted to max
  // potential for this character (max-level main stat + remaining rolls into
  // the character's best substats). IDs are preserved so solver results still
  // reference the real discs. Filtering above uses real levels.
  const { boostedDiscsBySlot, potentialDiscMap } = useMemo(() => {
    const empty = {
      boostedDiscsBySlot: discsBySlot,
      potentialDiscMap: {} as Record<string, ICachedDisc>,
    }
    if (!usePotentialBest) return empty
    const effectiveStats = getMergedEffectiveStats(characterKey, database)
    const weights = getMergedSubstatWeights(characterKey, database)
    const map: Record<string, ICachedDisc> = {}
    const boosted = Object.fromEntries(
      (Object.entries(discsBySlot) as [DiscSlotKey, ICachedDisc[]][]).map(
        ([slot, slotDiscs]) => [
          slot,
          slotDiscs.map((d) => {
            const b = boostDiscToPotential(d, effectiveStats, weights)
            if (b !== d) map[d.id] = b
            return b
          }),
        ]
      )
    ) as Record<DiscSlotKey, ICachedDisc[]>
    return { boostedDiscsBySlot: boosted, potentialDiscMap: map }
  }, [discsBySlot, usePotentialBest, characterKey, database])

  const filteredWengineKeys = useMemo(
    () =>
      filterWengineKeys(allWengineData, {
        optWengine: optConfig.optWengine,
        wEngineTypes: optConfig.wEngineTypes,
        equippedWengineKey,
      }),
    [
      equippedWengineKey,
      allWengineData,
      optConfig.optWengine,
      optConfig.wEngineTypes,
    ]
  )

  // Compute filtered discs per slot based on active set filters.
  // When set filters are active, only discs from the selected sets
  // contribute to the permutation estimate shown to the user.
  const filteredDiscsBySlot = useMemo(
    () =>
      filterDiscsBySets(
        boostedDiscsBySlot,
        optConfig.setFilter2,
        optConfig.setFilter4
      ),
    [boostedDiscsBySlot, optConfig.setFilter2, optConfig.setFilter4]
  )

  // Total permutations (unfiltered, used for progress calculation only).
  // The solver searches the full disc space; progress tracks actual builds
  // searched against this total, NOT against the filtered count.
  const totalPermutations = useMemo(
    () =>
      buildCount(Object.values(boostedDiscsBySlot)) *
      filteredWengineKeys.length,
    [filteredWengineKeys.length, boostedDiscsBySlot]
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
    setPermutationDetails(buildPermutationDetails(discs, filteredDiscsBySlot))
    setPermutations(filteredPermutations)
  }, [
    discs,
    filteredDiscsBySlot,
    filteredPermutations,
    setPermutationDetails,
    setPermutations,
  ])

  return {
    discsBySlot: boostedDiscsBySlot,
    filteredWengineKeys,
    totalPermutations,
    potentialDiscMap,
  }
}
