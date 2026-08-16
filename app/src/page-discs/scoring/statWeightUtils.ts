import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import type { ZzzDatabase } from '../../db'
import {
  getCharacterEffectiveMainStats,
  getCharacterEffectiveStats,
  getCharacterSubstatWeights,
} from '../../util'

/**
 * Returns the effective stats for a character, merged with any custom overrides.
 */
export function getMergedEffectiveStats(
  charKey: CharacterKey,
  database?: ZzzDatabase
): DiscSubStatKey[] {
  const defaults = getCharacterEffectiveStats(charKey)
  if (!database) return defaults
  const override = database.statWeights.get(charKey)
  if (!override || !override.substatWeights) return defaults
  // If an override exists, include stats from defaults that aren't nulled,
  // plus any new stats from the override that have a non-null weight.
  const nulled = new Set(
    Object.entries(override.substatWeights)
      .filter(([, v]) => v === null)
      .map(([k]) => k)
  )
  const added = Object.entries(override.substatWeights)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k]) => k as DiscSubStatKey)
  const base = defaults.filter((s) => !nulled.has(s))
  const merged = [...new Set([...base, ...added])]
  return merged as DiscSubStatKey[]
}

/**
 * Returns the substat weights for a character, merged with any custom overrides.
 */
export function getMergedSubstatWeights(
  charKey: CharacterKey,
  database?: ZzzDatabase
): Partial<Record<DiscSubStatKey, number>> {
  const defaults = getCharacterSubstatWeights(charKey)
  if (!database) return defaults
  const override = database.statWeights.get(charKey)
  if (!override || !override.substatWeights) return defaults
  const merged = { ...defaults }
  for (const [key, value] of Object.entries(override.substatWeights)) {
    if (value === null) {
      delete merged[key as DiscSubStatKey]
    } else if (value !== undefined) {
      merged[key as DiscSubStatKey] = value
    }
  }
  return merged
}

/**
 * Returns the recommended main stats for a character, merged with any custom overrides.
 * Only returns overrides for slots 4, 5, 6.
 */
export function getMergedMainStats(
  charKey: CharacterKey,
  database?: ZzzDatabase
): Partial<Record<DiscSlotKey, DiscMainStatKey[]>> {
  const defaults = getCharacterEffectiveMainStats(charKey)
  if (!database) return defaults
  const override = database.statWeights.get(charKey)
  if (!override || !override.mainStats) return defaults
  const merged = { ...defaults }
  for (const [slot, stats] of Object.entries(override.mainStats)) {
    merged[slot as DiscSlotKey] = stats as DiscMainStatKey[]
  }
  return merged
}
