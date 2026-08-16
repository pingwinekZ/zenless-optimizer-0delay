import { createContext, useContext } from 'react'
import type { ICachedCharacter } from '../../db'

export const CharacterContext = createContext(
  undefined as ICachedCharacter | undefined
)

export function useCharacterContext() {
  return useContext(CharacterContext)
}
