import { ActionIcon, Box, Button, Grid, Skeleton } from '@mantine/core'
import { IconTrash, IconX } from '@tabler/icons-react'
import { CardThemed, ModalWrapper } from '@zenless-optimizer/common/ui'
import { Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { allSkillKeys, type CharacterKey } from '../../consts'
import {
  CharacterContext,
  useCharacter,
  useCharacterContext,
  useDatabaseContext,
} from '../../db-ui'
import { getCharStat } from '../../stats'
import {
  CharacterCard,
  CharacterCompactMindscapeSelector,
  CoreDropdown,
  EquippedGrid,
  LevelSelect,
  PotentialSelect,
  SkillDropdown,
} from '../../ui'

import { CharStatsDisplay } from './CharStatsDisplay'

export function CharacterEditor({
  characterKey,
  onClose,
}: {
  characterKey?: CharacterKey
  onClose: () => void
}) {
  return (
    <ModalWrapper opened={!!characterKey} onClose={onClose}>
      <Suspense fallback={<Skeleton width="100%" height={1000} />}>
        {characterKey && (
          <CharacterEditorContent
            key={characterKey}
            characterKey={characterKey}
            onClose={onClose}
          />
        )}
      </Suspense>
    </ModalWrapper>
  )
}

type CharacterDisplayCardProps = {
  characterKey: CharacterKey
  onClose?: () => void
}
function CharacterEditorContent({
  characterKey,
  onClose,
}: CharacterDisplayCardProps) {
  const character = useCharacter(characterKey)

  return (
    <CardThemed>
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Suspense fallback={<Skeleton width="100%" height={1000} />}>
          {character ? (
            <CharacterContext.Provider value={character}>
              <Content onClose={onClose} />
            </CharacterContext.Provider>
          ) : (
            <Skeleton width="100%" height={1000} />
          )}
        </Suspense>
      </Box>
    </CardThemed>
  )
}

export function Content({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation(['page_characters'])

  const { database } = useDatabaseContext()
  const character = useCharacterContext()!
  const { key: characterKey, equippedDiscs } = character
  const deleteCharacter = useCallback(async () => {
    const name = t(`${characterKey}`)
    if (!window.confirm(t('removeCharacter', { value: name }))) return
    database.chars.remove(characterKey)
    onClose?.()
  }, [database, characterKey, t, onClose])
  const hasPotential = useMemo(() => {
    return getCharStat(characterKey).potentialParams.length > 0
  }, [characterKey])

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <Box style={{ display: 'flex', gap: '0.25rem' }}>
        <Button
          color="red"
          onClick={() => deleteCharacter()}
          leftSection={<IconTrash />}
          style={{ marginLeft: 'auto' }}
        >
          {t('characterEditor.delete')}
        </Button>
        {!!onClose && (
          <ActionIcon onClick={onClose} variant="subtle">
            <IconX />
          </ActionIcon>
        )}
      </Box>
      <Box>
        <Grid style={{ justifyContent: 'center' }}>
          <Grid.Col span={{ xs: 6, sm: 4, md: 4, lg: 4 }}>
            <CardThemed
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <CharacterCard characterKey={characterKey} />
              <Box px="xs">
                <LevelSelect
                  level={character.level}
                  milestone={character.promotion}
                  setBoth={({ level, milestone }) =>
                    database.chars.set(characterKey, {
                      level,
                      promotion: milestone,
                    })
                  }
                />
              </Box>
              <Box px="xs">
                {hasPotential && (
                  <PotentialSelect
                    potential={character.potential}
                    setPotential={(potential) =>
                      database.chars.set(characterKey, {
                        potential,
                      })
                    }
                  />
                )}
              </Box>
              <CharacterCompactMindscapeSelector
                mindscape={character.mindscape}
                setMindscape={(mindscape) =>
                  database.chars.set(characterKey, {
                    mindscape,
                  })
                }
              />
              <CharStatsDisplay />
            </CardThemed>
          </Grid.Col>
          <Grid.Col
            span={{ xs: 6, sm: 8, md: 8, lg: 8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <Box>
              <Grid columns={3}>
                {allSkillKeys.map((sk) => (
                  <Grid.Col span={1} key={sk}>
                    <SkillDropdown key={sk} skillKey={sk} />
                  </Grid.Col>
                ))}
                <Grid.Col span={1} key={'core'}>
                  <CoreDropdown />
                </Grid.Col>
              </Grid>
            </Box>
            <Box>
              <EquippedGrid
                setWengine={(key) => {
                  database.chars.set(characterKey, {
                    wengineKey: key ?? '',
                  })
                }}
                setDisc={(slotKey, id) => {
                  if (!id)
                    equippedDiscs[slotKey] &&
                      database.discs.set(equippedDiscs[slotKey], {
                        location: '',
                      })
                  else
                    database.discs.set(id, {
                      location: characterKey,
                    })
                }}
              />
            </Box>
          </Grid.Col>
        </Grid>
      </Box>
    </Box>
  )
}
