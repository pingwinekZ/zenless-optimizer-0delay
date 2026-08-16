import type { IDisc } from '../../zood'
import type { DiscTabFilters } from '../discGrid/useDiscTabStore'

export function doesDiscPassFilters(
  disc: IDisc,
  filters: DiscTabFilters
): boolean {
  if (filters.slot.length && !filters.slot.includes(disc.slotKey)) return false
  if (filters.set.length && !filters.set.includes(disc.setKey)) return false
  if (filters.rarity.length && !filters.rarity.includes(disc.rarity))
    return false
  if (
    filters.level.length &&
    !filters.level.some((lv) => disc.level >= lv && disc.level <= lv + 2)
  )
    return false
  if (filters.equipped.length) {
    const isEquipped = !!disc.location
    if (!filters.equipped.includes(isEquipped)) return false
  }
  if (filters.mainStat.length && !filters.mainStat.includes(disc.mainStatKey))
    return false
  if (
    filters.subStat.length &&
    !filters.subStat.every((key) => disc.substats.some((s) => s.key === key))
  )
    return false
  return true
}
