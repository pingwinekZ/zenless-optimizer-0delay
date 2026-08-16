import { Box, CardSection, Stack, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { monsterAsset } from '../assets'
import type { AttributeKey } from '../consts'
import type { TeamBonusStat, TeamEnemyStat } from '../db'
import { getTeamFrame0 } from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import { getCharStat } from '../stats'
import { parseBuffDescription } from './parseBuffDescription'
import seasons from './shiyuSeasons_gen.json'

function getActiveSeason() {
  const now = Date.now()
  for (const season of seasons) {
    const begin = new Date(season.beginTime!).getTime()
    const end = new Date(season.endTime!).getTime()
    if (begin <= now && now < end) return season
  }
  return null
}

type SeasonRoom = (typeof seasons)[number]['rooms'][number]

export function ShiyuDefenseBuffs() {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!

  const activeSeason = getActiveSeason()
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
    if (config.bonusStats.length > 0 || config.enemyStats.length > 0) {
      const characterSpecialty = getCharStat(characterKey).specialty
      const newBonusStats: TeamBonusStat[] = config.bonusStats
        .filter(
          ({ specialty }) => !specialty || specialty === characterSpecialty
        )
        .map(({ tag, value }) => ({
          tag,
          value,
          disabled: false,
        }))
      const newEnemyStats: TeamEnemyStat[] = config.enemyStats
        .filter(
          ({ specialty }) => !specialty || specialty === characterSpecialty
        )
        .map(({ tag, value }) => ({
          tag,
          value,
        }))
      database.teams.setFrame0(characterKey, (frame) => {
        const nonResists = frame.enemyStats.filter((s) => s.tag.q !== 'res_')
        return {
          bonusStats: newBonusStats,
          enemyStats: [...bossStats, ...nonResists, ...newEnemyStats],
          description: `sd_room:${room.id}`,
        }
      })
    } else {
      database.teams.setFrame0(characterKey, {
        enemyStats: bossStats,
        description: `sd_room:${room.id}`,
      })
    }
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
        <Text size="sm" fw={700}>
          {`${t('sdBuffs')} - ${activeSeason.name}`}
        </Text>
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
