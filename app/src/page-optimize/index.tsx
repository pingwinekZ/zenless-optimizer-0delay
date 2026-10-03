import { Box, Button, Flex, Text } from '@mantine/core'
import { IconUserPlus } from '@tabler/icons-react'
import {
  useDataEntryBase,
  useDataManagerKeys,
} from '@zenless-optimizer/common/database-ui'
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
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { TeamConditional } from '@zenless-optimizer/zzz/db'
import {
  CharacterContext,
  useCharacter,
  useDatabaseContext,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import {
  getConditional,
  isMember,
  isSheet,
  type Tag,
} from '@zenless-optimizer/zzz/formula'
import { CharCalcProvider } from '@zenless-optimizer/zzz/formula-ui'
import { i18n } from '@zenless-optimizer/zzz/i18n'
import { CharacterName } from '@zenless-optimizer/zzz/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CharacterOptDisplay } from './CharacterOptDisplay'
import { TeamHeaderHeightContext } from './context/TeamHeaderHeightContext'

export default function PageOptimize({
  onNavigateToCharacters,
}: {
  onNavigateToCharacters?: () => void
} = {}) {
  const { database } = useDatabaseContext()
  const { optCharKey } = useDataEntryBase(database.dbMeta)
  const databaseCharKeys = useDataManagerKeys(database.chars)
  // The optimizer is scoped to the characters added on the characters page and
  // never creates one itself. A saved `optCharKey` that was since removed falls
  // back to the first added character, and an empty database stays empty so the
  // empty state renders.
  const characterKey =
    (optCharKey && databaseCharKeys.includes(optCharKey)
      ? optCharKey
      : undefined) ?? databaseCharKeys[0]
  const { t } = useTranslation(['charNames_gen', 'page_optimize'])
  const character = useCharacter(characterKey)
  const team = useTeam(characterKey)

  // Team records are still created on demand (a character can arrive from an
  // import without one) — in useEffect to avoid triggering state updates on
  // other components during render. Character records themselves are only ever
  // created on the characters page.
  useEffect(() => {
    if (characterKey && !team) database.teams.getOrCreate(characterKey)
  }, [characterKey, team, database.teams])

  // Preload locale namespaces for the current team so conditional labels
  // (`char_X`, `wengine_X`, `disc_X`) and hover docs (`*_gen`) are already
  // cached before the user hovers. Without this the first hover fetches the
  // namespace on demand, leaving the hover box empty for a split second.
  useEffect(() => {
    if (!characterKey) return
    const ns = new Set<string>()
    const teammateKeys = team?.teammates.map((t) => t.characterKey) ?? []
    const allCharKeys = [characterKey, ...teammateKeys]
    for (const ck of allCharKeys) {
      if (!ck) continue
      ns.add(`char_${ck}`)
      ns.add(`char_${ck}_gen`)
      const char = database.chars.get(ck as CharacterKey)
      const wkey = char?.wengineKey
      if (wkey) {
        ns.add(`wengine_${wkey}`)
        ns.add(`wengine_${wkey}_gen`)
      }
      for (const discId of Object.values(char?.equippedDiscs ?? {})) {
        if (!discId) continue
        const setKey = database.discs.get(discId)?.setKey
        if (setKey) {
          ns.add(`disc_${setKey}`)
          ns.add(`disc_${setKey}_gen`)
        }
      }
    }
    if (ns.size > 0) void i18n.loadNamespaces([...ns])
  }, [characterKey, team, database])
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
      if (!characterKey) return
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
  const tag = useMemo<Tag | undefined>(
    () =>
      characterKey
        ? {
            src: characterKey,
            dst: characterKey,
            preset: `preset0`,
          }
        : undefined,
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

  if (!characterKey) {
    return (
      <OptimizeEmptyState onNavigateToCharacters={onNavigateToCharacters} />
    )
  }

  return (
    <Box>
      {character && team && tag && (
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

/**
 * Shown when the local database has no characters at all. The optimizer used to
 * silently add the game's first character in this situation, which made an
 * empty database impossible to reach.
 */
function OptimizeEmptyState({
  onNavigateToCharacters,
}: {
  onNavigateToCharacters?: () => void
}) {
  const { t } = useTranslation('page_optimize')
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap={8}
      mih={320}
      c="dimmed"
    >
      <IconUserPlus size={48} opacity={0.3} />
      <Text fw={600}>{t('noCharacters.title')}</Text>
      <Text size="sm" ta="center" maw={360}>
        {t('noCharacters.description')}
      </Text>
      {onNavigateToCharacters && (
        <Button variant="default" mt={4} onClick={onNavigateToCharacters}>
          {t('noCharacters.action')}
        </Button>
      )}
    </Flex>
  )
}

export { FilterContainer } from './layout/FilterContainer'
export { FilterRow } from './layout/FilterRow'
export { HeaderText } from './layout/HeaderText'
export { MultiSelectPills } from './layout/MultiSelectPills'
