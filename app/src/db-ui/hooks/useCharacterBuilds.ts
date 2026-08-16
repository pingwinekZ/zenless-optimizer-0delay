import { useDataManagerKeys } from '@zenless-optimizer/common/database-ui'
import { useMemo } from 'react'
import type { CharacterKey } from '../../consts'
import { useDatabaseContext } from '../context'

export function useCharacterBuilds(characterKey: CharacterKey | undefined) {
  const { database } = useDatabaseContext()
  const buildKeys = useDataManagerKeys(database.characterBuilds)

  return useMemo(
    () =>
      buildKeys
        .map((k) => database.characterBuilds.get(k))
        .filter((b) => b?.characterKey === characterKey),
    [buildKeys, characterKey, database.characterBuilds]
  )
}
