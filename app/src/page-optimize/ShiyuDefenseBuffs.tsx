import { ActionIcon, Box, CardSection, Flex, Stack, Text } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { monsterAsset } from '../assets'
import type { AttributeKey } from '../consts'
import type { TeamBonusStat, TeamEnemyStat } from '../db'
import { getTeamFrame0 } from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import { getCharStat } from '../stats'
import { parseBuffDescription } from './parseBuffDescription'
import seasons from './shiyuSeasons_gen.json'

const validSeasons = seasons
  .filter((s) => s.beginTime && s.endTime)
  .sort(
    (a, b) =>
      new Date(a.beginTime!).getTime() - new Date(b.beginTime!).getTime()
  )

function getActiveSeasonIndex(): number {
  const now = Date.now()
  for (let i = validSeasons.length - 1; i >= 0; i--) {
    const season = validSeasons[i]
    const begin = new Date(season.beginTime!).getTime()
    const end = new Date(season.endTime!).getTime()
    if (begin <= now && now < end) return i
  }
  return validSeasons.length - 1
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

type SeasonRoom = (typeof seasons)[number]['rooms'][number]

export function ShiyuDefenseBuffs() {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!

  const [seasonIdx, setSeasonIdx] = useState(getActiveSeasonIndex)
  const minSeasonIdx = getActiveSeasonIndex()
  const activeSeason = validSeasons[seasonIdx] ?? null
  const rooms = activeSeason?.rooms ?? []

  const applyRoom = (room: SeasonRoom) => {
    const bossStats: TeamEnemyStat[] = []
    if (room.enemyResists)
      Object.entries(room.enemyResists).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: val,
        })
      )
    if (room.enemyWeak)
      Object.entries(room.enemyWeak).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: -val,
        })
      )

    database.teams.set(characterKey, {
      enemyLvl: room.monsterLevel,
      enemyDef: room.bigMonster.stats.Defence,
    })

    const config = room.buff
      ? parseBuffDescription(room.buff.desc)
      : { bonusStats: [], enemyStats: [] }
    // Clean apply: replace all buff stats with this room's base stats,
    // clearing anything left over from other rooms/modes.
    const characterSpecialty = getCharStat(characterKey).specialty
    const newBonusStats: TeamBonusStat[] = config.bonusStats
      .filter(({ specialty }) => !specialty || specialty === characterSpecialty)
      .map(({ tag, value }) => ({
        tag,
        value,
        disabled: false,
      }))
    const newEnemyStats: TeamEnemyStat[] = config.enemyStats
      .filter(({ specialty }) => !specialty || specialty === characterSpecialty)
      .map(({ tag, value }) => ({
        tag,
        value,
      }))
    database.teams.setFrame0(characterKey, {
      bonusStats: newBonusStats,
      enemyStats: [...bossStats, ...newEnemyStats],
      description: `sd_room:${room.id}`,
    })
  }

  const selectedRoomId = getTeamFrame0(team).description?.startsWith('sd_room:')
    ? getTeamFrame0(team).description!.slice(8)
    : null

  if (!activeSeason) return null

  return (
    <CardThemed bgt="light">
      <CardSection
        style={{
          padding: 12,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Flex justify="space-between" align="center">
          <ActionIcon
            size="sm"
            variant="subtle"
            disabled={seasonIdx <= minSeasonIdx}
            onClick={() => setSeasonIdx((i) => i - 1)}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Text size="sm" fw={700} style={{ textAlign: 'center', flex: 1 }}>
            {activeSeason
              ? `${t('sdBuffs')} (${formatDate(activeSeason.beginTime!)} - ${formatDate(activeSeason.endTime!)})`
              : t('sdBuffs')}
          </Text>
          <ActionIcon
            size="sm"
            variant="subtle"
            disabled={seasonIdx >= validSeasons.length - 1}
            onClick={() => setSeasonIdx((i) => i + 1)}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Flex>
      </CardSection>
      <CardSection style={{ padding: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {rooms.map((room) => {
            const config = room.buff
              ? parseBuffDescription(room.buff.desc)
              : { bonusStats: [], enemyStats: [] }
            const hasConfig =
              config.bonusStats.length > 0 || config.enemyStats.length > 0
            const imgSrc = monsterAsset(room.bigMonster.image)
            return (
              <CardThemed
                key={room.id}
                bgt="dark"
                style={{
                  outline: `2px solid ${
                    room.id === selectedRoomId
                      ? 'var(--mantine-color-yellow-6)'
                      : 'transparent'
                  }`,
                  opacity: hasConfig ? 1 : 0.5,
                }}
              >
                <CardSection
                  onClick={() => hasConfig && applyRoom(room)}
                  style={{
                    cursor: hasConfig ? 'pointer' : 'default',
                    padding: 8,
                  }}
                >
                  <Stack align="center" gap={4}>
                    {imgSrc && (
                      <Box
                        component="img"
                        src={imgSrc}
                        alt={room.bigMonster.name}
                        style={{
                          width: 96,
                          height: 96,
                          objectFit: 'contain',
                        }}
                      />
                    )}
                    <Text size="xs" fw={700} style={{ textAlign: 'center' }}>
                      {room.bigMonster.name}
                    </Text>
                    <Text size="xs" style={{ textAlign: 'center' }}>
                      {room.name}
                    </Text>
                    {room.buff && (
                      <Text size="xs" fw={500} style={{ textAlign: 'center' }}>
                        {room.buff.title}
                      </Text>
                    )}
                    {room.buff && (
                      <Text
                        size="xs"
                        style={{ textAlign: 'center' }}
                        dangerouslySetInnerHTML={{
                          __html: room.buff.desc
                            .replace(/\n/g, ' ')
                            .replace(
                              /<color=(#[A-Fa-f0-9]{6})>/g,
                              '<span style="color:$1">'
                            )
                            .replace(/<\/color>/g, '</span>')
                            .trim(),
                        }}
                      />
                    )}
                    {!hasConfig && room.buff && (
                      <Text size="xs" c="dimmed">
                        No stat mapping
                      </Text>
                    )}
                  </Stack>
                </CardSection>
              </CardThemed>
            )
          })}
        </div>
      </CardSection>
    </CardThemed>
  )
}
