import { Box } from '@mantine/core'
import { useDataEntryBase } from '@zenless-optimizer/common/database-ui'
import { useTitle } from '@zenless-optimizer/common/ui'
import { objKeyMap, stableArr } from '@zenless-optimizer/common/util'
import type { DebugReadContextObj } from '@zenless-optimizer/game-opt/formula-ui'
import {
  DebugReadContext,
  DebugReadModal,
  TagContext,
} from '@zenless-optimizer/game-opt/formula-ui'
import type { SetConditionalFunc } from '@zenless-optimizer/game-opt/sheet-ui'
import {
  ConditionalValuesContext,
  SetConditionalContext,
  SrcDstDisplayContext,
} from '@zenless-optimizer/game-opt/sheet-ui'
import type { BaseRead } from '@zenless-optimizer/pando/engine'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../consts'
import { allCharacterKeys } from '../consts'
import type { TeamConditional } from '../db'
import {
  CharacterContext,
  useCharacter,
  useDatabaseContext,
  useTeam,
} from '../db-ui'
import { getConditional, isMember, isSheet, type Tag } from '../formula'
import { CharCalcProvider } from '../formula-ui'
import { CharacterName } from '../ui'
import { CharacterOptDisplay } from './CharacterOptDisplay'
import { TeamHeaderHeightContext } from './context/TeamHeaderHeightContext'

export default function PageOptimize() {
  const { database } = useDatabaseContext()
  const { optCharKey } = useDataEntryBase(database.dbMeta)
  const characterKey = optCharKey ?? allCharacterKeys[0]
  const { t } = useTranslation(['charNames_gen', 'page_character'])
  const character = useCharacter(characterKey)
  const team = useTeam(characterKey)

  // Create character/team if they don't exist yet — in useEffect to avoid
  // triggering state updates on other components during render
  useEffect(() => {
    if (characterKey && !character) database.chars.getOrCreate(characterKey)
    if (characterKey && !team) database.teams.getOrCreate(characterKey)
  }, [characterKey, character, team, database])
  useTitle(
    useMemo(() => {
      const charName = characterKey && t(`charNames_gen:${characterKey}`)
      return charName ? `Optimize - ${charName}` : `Optimize`
    }, [characterKey, t])
  )
  const srcDstDisplayContextValue = useMemo(() => {
    const charList =
      team?.teammates.map((t) => t.characterKey) ?? stableArr<CharacterKey>()

    const charDisplay = objKeyMap(charList, (ck) => (
      <CharacterName characterKey={ck} />
    ))
    return {
      srcDisplay: charDisplay,
      dstDisplay: charDisplay,
    }
  }, [team])

  const setConditional = useCallback<SetConditionalFunc>(
    (
      sheet: string,
      condKey: string,
      src: string,
      dst: string | null,
      condValue: number
    ) => {
      if (!isSheet(sheet) || !isMember(src) || !(dst === null || isMember(dst)))
        return
      const cond = getConditional(sheet, condKey)
      if (!cond) return

      database.teams.setFrameConditional(
        characterKey,
        0,
        sheet,
        condKey,
        src,
        dst,
        condValue
      )
    },
    [characterKey, database.teams]
  )
  const tag = useMemo<Tag>(
    () => ({
      src: characterKey,
      dst: characterKey,
      preset: `preset0`,
    }),
    [characterKey]
  )

  const [debugRead, setDebugRead] = useState<BaseRead>()
  const debugObj = useMemo<DebugReadContextObj>(
    () => ({
      read: debugRead,
      setRead: setDebugRead,
    }),
    [debugRead]
  )
  return (
    <Box>
      {character && team && (
        <CharacterContext.Provider value={character}>
          <TagContext.Provider value={tag}>
            <CharCalcProvider
              character={character}
              team={team}
              discIds={character.equippedDiscs}
            >
              <SrcDstDisplayContext.Provider value={srcDstDisplayContextValue}>
                <ConditionalValuesContext.Provider
                  value={
                    team.frames[0]?.conditionals ?? stableArr<TeamConditional>()
                  }
                >
                  <SetConditionalContext.Provider value={setConditional}>
                    <DebugReadContext.Provider value={debugObj}>
                      <DebugReadModal />
                      <Box
                        style={{
                          display: 'flex',
                          gap: 1,
                          flexDirection: 'column',
                          marginTop: 4,
                        }}
                      >
                        <TeamHeaderHeightContext.Provider value={74}>
                          <CharacterOptDisplay key={character.key} />
                        </TeamHeaderHeightContext.Provider>
                      </Box>
                    </DebugReadContext.Provider>
                  </SetConditionalContext.Provider>
                </ConditionalValuesContext.Provider>
              </SrcDstDisplayContext.Provider>
            </CharCalcProvider>
          </TagContext.Provider>
        </CharacterContext.Provider>
      )}
    </Box>
  )
}

export { FilterContainer } from './layout/FilterContainer'
export { FilterRow } from './layout/FilterRow'
export { HeaderText } from './layout/HeaderText'
export { MultiSelectPills } from './layout/MultiSelectPills'
