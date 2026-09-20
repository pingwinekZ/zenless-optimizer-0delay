import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { Team } from '@zenless-optimizer/zzz/db'
import { useDatabaseContext } from '../context'

export function useTeam(
  characterKey: CharacterKey | '' | undefined
): Team | undefined {
  const { database } = useDatabaseContext()
  return useDataManagerBase(database.teams, characterKey as CharacterKey)
}
