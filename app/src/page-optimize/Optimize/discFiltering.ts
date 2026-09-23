import type {
  CharacterKey,
  DiscSetKey,
  DiscSlotKey,
  WengineKey,
} from '@zenless-optimizer/zzz/consts'
import type { ICachedDisc } from '@zenless-optimizer/zzz/db'
import { getWengineStat } from '@zenless-optimizer/zzz/stats'
import { hasHigherPriority } from '@zenless-optimizer/zzz/util'

/** Options for pooling discs by slot (level/equipped/priority/main-stat). */
export type DiscPoolOptions = {
  levelLow: number
  levelHigh: number
  useEquipped: boolean
  useCharacterPriority: boolean
  slot4: ReadonlyArray<ICachedDisc['mainStatKey']>
  slot5: ReadonlyArray<ICachedDisc['mainStatKey']>
  slot6: ReadonlyArray<ICachedDisc['mainStatKey']>
  characterKey: CharacterKey
  customSortOrder: string[]
}

/** Group discs by slot, applying level/equipped/priority/main-stat filters. */
export function filterDiscsBySlot(
  discs: readonly ICachedDisc[],
  opts: DiscPoolOptions
): Record<DiscSlotKey, ICachedDisc[]> {
  const slotKeyMap = {
    4: opts.slot4,
    5: opts.slot5,
    6: opts.slot6,
  } as const
  const isFilteredSlot = (slotKey: DiscSlotKey): slotKey is '4' | '5' | '6' =>
    ['4', '5', '6'].includes(slotKey)

  // Get custom sort order for priority checking
  // When empty, all characters have equal priority (no filtering)
  const { customSortOrder } = opts

  return discs.reduce(
    (discsBySlot, disc) => {
      const { slotKey, mainStatKey, level, location } = disc
      if (level < opts.levelLow || level > opts.levelHigh) return discsBySlot

      // Existing logic: exclude if useEquipped is false
      if (location && !opts.useEquipped && location !== opts.characterKey)
        return discsBySlot

      // Priority-based filtering: exclude discs from higher-priority characters
      if (
        location &&
        opts.useEquipped &&
        opts.useCharacterPriority &&
        location !== opts.characterKey
      ) {
        // Check if disc owner has higher priority
        if (hasHigherPriority(location, opts.characterKey, customSortOrder)) {
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
}

/** Wengine keys to search: equipped only, or all of the selected types. */
export function filterWengineKeys(
  allWengineData: ReadonlyArray<{ key: WengineKey }>,
  opts: {
    optWengine: boolean
    wEngineTypes: ReadonlyArray<string>
    equippedWengineKey: WengineKey | '' | undefined
  }
): WengineKey[] {
  if (!opts.optWengine) {
    return opts.equippedWengineKey ? [opts.equippedWengineKey] : []
  }
  return allWengineData
    .filter(({ key }) => {
      const { type } = getWengineStat(key)
      return opts.wEngineTypes.includes(type)
    })
    .map(({ key }) => key)
}

/** Narrow per-slot discs to the active 2pc/4pc set filters (if any). */
export function filterDiscsBySets(
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>,
  setFilter2: ReadonlyArray<DiscSetKey> | undefined,
  setFilter4: ReadonlyArray<DiscSetKey> | undefined
): Record<DiscSlotKey, ICachedDisc[]> {
  const activeSetKeys = new Set([...(setFilter2 ?? []), ...(setFilter4 ?? [])])
  if (!activeSetKeys.size) return discsBySlot
  return Object.fromEntries(
    Object.entries(discsBySlot).map(([slot, discs]) => [
      slot,
      discs.filter((d) => activeSetKeys.has(d.setKey)),
    ])
  ) as Record<DiscSlotKey, ICachedDisc[]>
}

/** Per-slot filtered/total counts for the sidebar permutation display. */
export function buildPermutationDetails(
  discs: readonly ICachedDisc[],
  filteredDiscsBySlot: Record<DiscSlotKey, ICachedDisc[]>
): Record<string, { count: number; total: number }> {
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
  return details
}
