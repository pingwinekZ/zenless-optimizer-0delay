import type { CharacterKey } from '../../consts'

/**
 * Get priority index for a character from the customSortOrder array.
 * Lower index = higher priority (more protected).
 * Returns Infinity if character not in priority list (least protected).
 */
export function getCharacterPriority(
  characterKey: CharacterKey,
  customSortOrder: string[]
): number {
  const index = customSortOrder.indexOf(characterKey)
  return index === -1 ? Infinity : index
}

/**
 * Check if a disc owner has higher priority than the current character.
 * Higher priority = lower index = disc is protected.
 */
export function hasHigherPriority(
  discOwnerKey: CharacterKey,
  currentCharacterKey: CharacterKey,
  customSortOrder: string[]
): boolean {
  const ownerPriority = getCharacterPriority(discOwnerKey, customSortOrder)
  const currentPriority = getCharacterPriority(
    currentCharacterKey,
    customSortOrder
  )
  return ownerPriority < currentPriority
}
