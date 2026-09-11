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
import seasons from './daSeasons_gen.json'
import { parseBuffDescription } from './parseBuffDescription'

type DaBuff = { id: string; title: string; desc: string }

type DaZone = {
  name: string
  monsterLevel: number
  monsterName: string
  monsterDef: number
  monsterImage: string
  enemyResists?: Record<string, number>
  enemyWeak?: Record<string, number>
  buffs: DaBuff[]
  zoneBuffs?: DaBuff[]
  hard?: boolean
}

type DaSeason = {
  id: number
  beginTime?: string
  endTime?: string
  zones: DaZone[]
}

const validSeasons = (seasons as DaSeason[])
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

type SeasonZone = DaZone

function formatBuffHtml(desc: string): string {
  return desc
    .replace(/\n/g, ' ')
    .replace(/<color=(#[A-Fa-f0-9]{6})>/g, '<span style="color:$1">')
    .replace(/<\/color>/g, '</span>')
    .trim()
}

function hasStatMapping(desc: string): boolean {
  const config = parseBuffDescription(desc)
  return config.bonusStats.length > 0 || config.enemyStats.length > 0
}

function parseDaSelection(description?: string): {
  bossName: string | null
  buffIds: string[]
} {
  const empty = { bossName: null, buffIds: [] }
  if (!description) return empty
  let bossName: string | null = null
  let buffIds: string[] = []
  for (const part of description.split('|')) {
    if (part.startsWith('da_boss:'))
      bossName = part.slice('da_boss:'.length) || null
    else if (part.startsWith('da_buffs:'))
      buffIds = part.slice('da_buffs:'.length).split(',').filter(Boolean)
  }
  if (!bossName && buffIds.length === 0) return empty
  return { bossName, buffIds }
}

function encodeDaSelection(
  bossName: string | null,
  buffIds: string[]
): string | undefined {
  const parts: string[] = []
  if (bossName) parts.push(`da_boss:${bossName}`)
  if (buffIds.length > 0) parts.push(`da_buffs:${buffIds.join(',')}`)
  return parts.length > 0 ? parts.join('|') : undefined
}

function BossCard({
  zone,
  selected,
  onSelect,
}: {
  zone: SeasonZone
  selected: boolean
  onSelect: () => void
}) {
  const imgSrc = monsterAsset(zone.monsterImage)
  // Only show zone buffs that map to stats — score-only entries
  // (Performance Points, specialty suitability) are hidden entirely.
  const zoneBuffs = (zone.zoneBuffs ?? []).filter((buff) =>
    hasStatMapping(buff.desc)
  )
  return (
    <CardThemed
      bgt="dark"
      style={{
        outline: `2px solid ${
          selected ? 'var(--mantine-color-yellow-6)' : 'transparent'
        }`,
      }}
    >
      <CardSection onClick={onSelect} style={{ cursor: 'pointer', padding: 8 }}>
        <Stack align="center" gap={4}>
          {imgSrc && (
            <Box
              component="img"
              src={imgSrc}
              alt={zone.monsterName ?? zone.name}
              style={{ width: 96, height: 96, objectFit: 'contain' }}
            />
          )}
          <Text size="xs" style={{ textAlign: 'center' }}>
            {zone.name}
          </Text>
          {zoneBuffs.map((buff) => {
            return (
              <Stack key={buff.id} gap={2} style={{ width: '100%' }}>
                {buff.title ? (
                  <Text size="xs" fw={500} style={{ textAlign: 'center' }}>
                    {buff.title}
                  </Text>
                ) : (
                  <Text
                    size="xs"
                    fw={500}
                    c="dimmed"
                    style={{ textAlign: 'center' }}
                  >
                    Zone Buff
                  </Text>
                )}
                <Text
                  size="xs"
                  style={{ textAlign: 'center' }}
                  dangerouslySetInnerHTML={{
                    __html: formatBuffHtml(buff.desc),
                  }}
                />
              </Stack>
            )
          })}
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

export function DeadlyAssaultBuffs() {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!

  const [seasonIdx, setSeasonIdx] = useState(getActiveSeasonIndex)
  const minSeasonIdx = getActiveSeasonIndex()
  const activeSeason = validSeasons[seasonIdx] ?? null
  const zones: SeasonZone[] = activeSeason?.zones ?? []
  const seen = new Set<string>()
  const buffs = activeSeason
    ? (activeSeason.zones
        .flatMap((z) => z.buffs ?? [])
        .filter((b) => {
          if (seen.has(b.title)) return false
          seen.add(b.title)
          return true
        }) ?? [])
    : []

  const hardZone = zones.find((z) => 'hard' in z && z.hard)
  const normalZones = zones.filter((z) => !('hard' in z) || !z.hard)

  // Selection state is encoded in the frame description so it survives
  // drawer close/reopen: `da_boss:<name>` plus optional
  // `|da_buffs:<id>,<id>` for stacked selectable buffs.
  const { bossName: selectedBossName, buffIds: appliedBuffIds } =
    parseDaSelection(getTeamFrame0(team).description)
  const selectedZone = zones.find((z) => z.name === selectedBossName) ?? null

  const collectParsedStats = (
    descs: string[],
    characterSpecialty: string
  ): { bonusStats: TeamBonusStat[]; enemyStats: TeamEnemyStat[] } => {
    const bonusStats: TeamBonusStat[] = []
    const enemyStats: TeamEnemyStat[] = []
    for (const desc of descs) {
      const config = parseBuffDescription(desc)
      for (const { tag, value, specialty } of config.bonusStats) {
        if (specialty && specialty !== characterSpecialty) continue
        bonusStats.push({ tag, value, disabled: false })
      }
      for (const { tag, value, specialty } of config.enemyStats) {
        if (specialty && specialty !== characterSpecialty) continue
        enemyStats.push({ tag, value })
      }
    }
    return { bonusStats, enemyStats }
  }

  const findSeasonBuff = (id: string): DaBuff | undefined => {
    for (const z of zones) {
      const found = (z.buffs ?? []).find((b) => b.id === id)
      if (found) return found
    }
    return undefined
  }

  // Single write path: zone base stats (boss + Zone Buffs) with the
  // checked selectable buffs layered on top.
  const writeDaFrame = (zone: SeasonZone | null, buffIds: string[]) => {
    const bossStats: TeamEnemyStat[] = []
    if (zone?.enemyResists)
      Object.entries(zone.enemyResists).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: val,
        })
      )
    if (zone?.enemyWeak)
      Object.entries(zone.enemyWeak).forEach(([attr, val]) =>
        bossStats.push({
          tag: { q: 'res_', attribute: attr as AttributeKey },
          value: -val,
        })
      )
    const characterSpecialty = getCharStat(characterKey).specialty
    const zoneStats = collectParsedStats(
      (zone?.zoneBuffs ?? []).map((b) => b.desc),
      characterSpecialty
    )
    const selectableStats = collectParsedStats(
      buffIds.flatMap((id) => {
        const buff = findSeasonBuff(id)
        return buff ? [buff.desc] : []
      }),
      characterSpecialty
    )
    // No zone in view (e.g. toggling before any boss is selected):
    // keep existing boss resists instead of wiping them.
    const prevResists = zone
      ? []
      : getTeamFrame0(team).enemyStats.filter((s) => s.tag.q === 'res_')
    database.teams.setFrame0(characterKey, {
      description: encodeDaSelection(zone?.name ?? null, buffIds),
      bonusStats: [...zoneStats.bonusStats, ...selectableStats.bonusStats],
      enemyStats: [
        ...prevResists,
        ...bossStats,
        ...zoneStats.enemyStats,
        ...selectableStats.enemyStats,
      ],
    })
    if (zone)
      database.teams.set(characterKey, {
        enemyLvl: zone.monsterLevel,
        enemyDef: zone.monsterDef,
      })
  }

  // Boss select cleanly (re)applies the room: zone base stats only,
  // previously stacked selectable buffs are cleared.
  const selectBoss = (zone: SeasonZone) => writeDaFrame(zone, [])

  // Selectable buffs toggle on top of the zone base stats.
  // IDs from another season view are pruned since they can't resolve here.
  const toggleBuff = (buff: DaBuff) => {
    const knownIds = new Set(
      zones.flatMap((z) => (z.buffs ?? []).map((b) => b.id))
    )
    const nextIds = (
      appliedBuffIds.includes(buff.id)
        ? appliedBuffIds.filter((id) => id !== buff.id)
        : [...appliedBuffIds, buff.id]
    ).filter((id) => knownIds.has(id))
    writeDaFrame(selectedZone, nextIds)
  }

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
              ? `${t('daBuffs')} (${formatDate(activeSeason.beginTime!)} - ${formatDate(activeSeason.endTime!)})`
              : t('daBuffs')}
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
        {hardZone && (
          <div style={{ marginBottom: 8 }}>
            <BossCard
              zone={hardZone}
              selected={hardZone.name === selectedBossName}
              onSelect={() => selectBoss(hardZone)}
            />
          </div>
        )}
        {normalZones.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {normalZones.map((zone) => (
              <BossCard
                key={zone.name}
                zone={zone}
                selected={zone.name === selectedBossName}
                onSelect={() => selectBoss(zone)}
              />
            ))}
          </div>
        )}
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
            const applied = appliedBuffIds.includes(buff.id)
            return (
              <CardThemed
                key={buff.id}
                bgt="dark"
                style={{
                  opacity: hasConfig ? 1 : 0.5,
                  outline: `2px solid ${
                    applied ? 'var(--mantine-color-yellow-6)' : 'transparent'
                  }`,
                }}
              >
                <CardSection
                  onClick={() => hasConfig && toggleBuff(buff)}
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
                        __html: formatBuffHtml(buff.desc),
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
