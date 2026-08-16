import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import type { CharacterKey } from '../../consts'
import type { Team } from '../../db'
import { useDatabaseContext } from '../context'

export function useTeam(
  characterKey: CharacterKey | '' | undefined
): Team | undefined {
  const { database } = useDatabaseContext()
  return useDataManagerBase(database.teams, characterKey as CharacterKey)
}
