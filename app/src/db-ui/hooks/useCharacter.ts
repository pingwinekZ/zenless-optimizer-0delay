import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import type { CharacterKey } from '../../consts'
import { useDatabaseContext } from '../context'

export function useCharacter(characterKey: CharacterKey | '' | undefined) {
  const { database } = useDatabaseContext()
  return useDataManagerBase(database.chars, characterKey as CharacterKey)
}
