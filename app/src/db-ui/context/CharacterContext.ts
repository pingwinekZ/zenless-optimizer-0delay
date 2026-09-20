import type { ICachedCharacter } from '@zenless-optimizer/zzz/db'
import { createContext, useContext } from 'react'

export const CharacterContext = createContext(
  undefined as ICachedCharacter | undefined
)

export function useCharacterContext() {
  return useContext(CharacterContext)
}
