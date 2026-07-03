import { Box, CardSection, Stack, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import type { AttributeKey } from '../consts'
import type { TeamBonusStat, TeamEnemyStat } from '../db'
import { getTeamFrame0 } from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import { getCharStat } from '../stats'
import seasons from './daSeasons_gen.json'
import { parseBuffDescription } from './parseBuffDescription'

const BOSS_CDN = 'https://static.nanoka.cc/assets/zzz'

function getActiveSeason() {
  const now = Date.now()
  let best: (typeof seasons)[number] | null = null
  let bestBegin = 0
  for (const season of seasons) {
    if (!season.beginTime || !season.endTime) continue
    const begin = new Date(season.beginTime).getTime()
    const end = new Date(season.endTime).getTime()
    if (begin <= now && now < end && begin > bestBegin) {
      best = season
      bestBegin = begin
    }
  }
  return best
}

type SeasonZone = (typeof seasons)[number]['zones'][number]

export function DeadlyAssaultBuffs() {
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!

  const activeSeason = getActiveSeason()
  const zones: SeasonZone[] = activeSeason?.zones ?? []
  const seen = new Set<string>()
  const buffs = activeSeason
    ? (zones[0]?.buffs.filter((b) => {
        if (seen.has(b.title)) return false
        seen.add(b.title)
        return true
      }) ?? [])
    : []

  const applyBuff = (desc: string) => {
    const config = parseBuffDescription(desc)
    if (!config.bonusStats.length && !config.enemyStats.length) return
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
    database.teams.setFrame0(characterKey, (frame) => {
      const bossResists = frame.enemyStats.filter((s) => s.tag.q === 'res_')
      return {
        bonusStats: newBonusStats,
        enemyStats: [...bossResists, ...newEnemyStats],
      }
    })
  }

  const selectBoss = (zone: SeasonZone) => {
    const bossStats: TeamEnemyStat[] = []
    if (zone.enemyResists)
      Object.entries(zone.enemyResists).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: val,
        })
      )
    if (zone.enemyWeak)
      Object.entries(zone.enemyWeak).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: -val,
        })
      )
    database.teams.setFrame0(characterKey, {
      description: `da_boss:${zone.name}`,
      enemyStats: bossStats,
    })
    database.teams.set(characterKey, {
      enemyLvl: zone.monsterLevel,
      enemyDef: zone.monsterDef,
    })
  }

  const selectedBossName = getTeamFrame0(team).description?.startsWith(
    'da_boss:'
  )
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
          Boss
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
          {zones.map((zone) => (
            <CardThemed
              key={zone.name}
              bgt="dark"
              style={{
                outline: `2px solid ${
                  zone.name === selectedBossName
                    ? 'var(--mantine-color-yellow-6)'
                    : 'transparent'
                }`,
              }}
            >
              <CardSection
                onClick={() => selectBoss(zone)}
                style={{ cursor: 'pointer', padding: 8 }}
              >
                <Stack align="center" gap={4}>
                  <Box
                    component="img"
                    src={`${BOSS_CDN}/Monster_${zone.monsterImage}.webp`}
                    alt={zone.monsterName ?? zone.name}
                    style={{ width: 96, height: 96, objectFit: 'contain' }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                    }}
                  />
                  <Text size="xs" style={{ textAlign: 'center' }}>
                    {zone.name}
                  </Text>
                </Stack>
              </CardSection>
            </CardThemed>
          ))}
        </div>
      </CardSection>

      <CardSection
        style={{
          padding: 12,
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Text size="sm" fw={700}>
          Buff
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
          {buffs.map((buff) => {
            const config = parseBuffDescription(buff.desc)
            const hasConfig =
              config.bonusStats.length > 0 || config.enemyStats.length > 0
            return (
              <CardThemed
                key={buff.id}
                bgt="dark"
                style={{ opacity: hasConfig ? 1 : 0.5 }}
              >
                <CardSection
                  onClick={() => hasConfig && applyBuff(buff.desc)}
                  style={{
                    cursor: hasConfig ? 'pointer' : 'default',
                    padding: 8,
                  }}
                >
                  <Stack gap={4}>
                    <Text size="sm" fw={700}>
                      {buff.title}
                    </Text>
                    <Text
                      size="xs"
                      dangerouslySetInnerHTML={{
                        __html: buff.desc
                          .replace(/\n/g, ' ')
                          .replace(
                            /<color=(#[A-Fa-f0-9]{6})>/g,
                            '<span style="color:$1">'
                          )
                          .replace(/<\/color>/g, '</span>')
                          .trim(),
                      }}
                    />
                    {!hasConfig && (
                      <Text size="xs" c="dimmed">
                        No stat mapping configured
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
