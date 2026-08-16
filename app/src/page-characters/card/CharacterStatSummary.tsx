import { Flex, Text } from '@mantine/core'
import { statKeyTextMap } from '../../consts'
import { StatIcon } from '../../svgicons'
import classes from './CharacterStatSummary.module.css'
import { StatText } from './StatText'

export function CharacterStatSummary({
  stats,
  attribute,
  zebra = false,
}: {
  stats: Record<string, number> | null
  attribute?: string
  zebra?: boolean
}) {
  const dmgDisplayKey = attribute ? `${attribute}_dmg_` : 'dmg_'
  return (
    <StatText className={classes.statSummary}>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
        className={zebra ? classes.zebra : undefined}
      >
        <CharacterStatRow statKey="hp" value={stats?.hp ?? 0} />
        <CharacterStatRow statKey="atk" value={stats?.atk ?? 0} />
        <CharacterStatRow statKey="def" value={stats?.def ?? 0} />
        <CharacterStatRow statKey="impact" value={stats?.impact ?? 0} />
        <CharacterStatRow statKey="crit_" value={stats?.crit_ ?? 0} />
        <CharacterStatRow statKey="crit_dmg_" value={stats?.crit_dmg_ ?? 0} />
        <CharacterStatRow statKey="pen" value={stats?.pen ?? 0} />
        <CharacterStatRow statKey="pen_" value={stats?.pen_ ?? 0} />
        <CharacterStatRow statKey="anomProf" value={stats?.anomProf ?? 0} />
        <CharacterStatRow statKey="anomMas" value={stats?.anomMas ?? 0} />
        <CharacterStatRow statKey="enerRegen" value={stats?.enerRegen ?? 0} />
        <CharacterStatRow statKey={dmgDisplayKey} value={stats?.dmg_ ?? 0} />
      </div>
    </StatText>
  )
}

export function CharacterStatRow({
  statKey,
  value,
}: {
  statKey: string
  value: number
}) {
  const displayName =
    statKeyTextMap[statKey as keyof typeof statKeyTextMap] ?? statKey
  const displayValue = formatStatValue(statKey, value)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 16,
      }}
    >
      <Flex gap={2} align="center" style={{ minWidth: 0 }}>
        <StatIcon
          statKey={statKey}
          iconProps={{ style: { fontSize: 22, fill: '#fff' } }}
        />
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName}
        </span>
      </Flex>
      <span role="separator" />
      <Text fw={600} style={{ whiteSpace: 'nowrap', marginLeft: 4 }}>
        {displayValue}
      </Text>
    </div>
  )
}

function formatStatValue(statKey: string, value: number): string {
  if (
    statKey.endsWith('_') ||
    statKey === 'crit_' ||
    statKey === 'crit_dmg_' ||
    statKey === 'pen_' ||
    statKey === 'dmg_'
  ) {
    return `${(value * 100).toFixed(1)}%`
  }
  if (value >= 1000) return value.toFixed(0)
  if (value >= 10) return parseFloat(value.toFixed(1)).toString()
  return parseFloat(value.toFixed(2)).toString()
}
