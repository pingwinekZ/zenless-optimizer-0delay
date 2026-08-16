import type { CharacterKey } from '../../consts'
import { getCharStat } from '../../stats'
import { getAttributeColor } from './colorUtils'

const characterShowcaseColors: Partial<Record<CharacterKey, string>> = {}

export function getCharacterShowcaseColor(characterKey: CharacterKey): string {
  const custom = characterShowcaseColors[characterKey]
  if (custom) return custom
  const stat = getCharStat(characterKey)
  return getAttributeColor(stat.attribute)
}
