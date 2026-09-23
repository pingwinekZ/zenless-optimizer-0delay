import type { Tag } from '@zenless-optimizer/zzz/formula'
import {
  damageTypeColor,
  damageTypeKeysMap,
  getDmgType,
} from '@zenless-optimizer/zzz/formula-ui'

// The palette lives in formula-ui so pills, charts and filter bars all read
// from one source; re-exported here as the panel's single import point.
export { damageTypeColor }

/** Human label for a damage type key (`exSpecial` → `EX Special`). */
export function damageTypeLabel(key: string): string {
  return damageTypeKeysMap[key as keyof typeof damageTypeKeysMap] ?? key
}

/**
 * The action's primary damage type, preferring the formula tag's authored
 * `damageType1` / `damageType2` and falling back to its attribute.
 */
export function tagDamageType(tag: Tag): string {
  return tag['damageType1'] ?? tag['damageType2'] ?? tag['attribute'] ?? 'basic'
}

/**
 * Every damage type a tag carries: both authored damage tags when it is a
 * damage formula, otherwise its attribute. The first entry is the primary type
 * used for color/partitioning, so the whole array is ordered primary-first.
 */
export function tagDamageTypes(tag: Tag): string[] {
  const dmgTypes = getDmgType(tag)
  if (dmgTypes.length > 0) return [...dmgTypes]
  const type = tagDamageType(tag)
  return type ? [type] : []
}
