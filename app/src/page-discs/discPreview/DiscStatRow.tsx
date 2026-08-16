import { Box, Text } from '@mantine/core'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import {
  type DiscRarityKey,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '../../consts'
import { StatIcon } from '../../svgicons'
import type { ISubstat } from '../../zood'

export function DiscStatRow({
  label,
  statKey,
  value,
  unit,
  highlighted,
}: {
  label: string
  statKey: string
  value: number
  unit: string
  highlighted?: boolean
}) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 6px',
        background: highlighted ? 'var(--primary-subtle)' : 'var(--layer-2)',
        borderRadius: 4,
        fontWeight: 600,
      }}
    >
      <StatIcon statKey={statKey} iconProps={{ style: { fontSize: 14 } }} />
      <Text size="sm" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text size="sm">
        {toPercent(value, statKey as any).toFixed(
          statKeyToFixed(statKey as any)
        )}
        {unit}
      </Text>
    </Box>
  )
}

export function DiscSubstatRow({
  substat,
  rarity,
  highlighted,
}: {
  substat: ISubstat
  rarity: DiscRarityKey
  highlighted?: boolean
}) {
  if (!substat.key || substat.upgrades === 0) return null
  const value = getDiscSubStatBaseVal(substat.key, rarity) * substat.upgrades
  return (
    <DiscStatRow
      label={statKeyTextMap[substat.key] ?? substat.key}
      statKey={substat.key}
      value={value}
      unit={getUnitStr(substat.key)}
      highlighted={highlighted}
    />
  )
}

export function DiscMainStatValueDisplay({
  statKey,
  rarity,
  level,
}: {
  statKey: string
  rarity: DiscRarityKey
  level: number
}) {
  const value = getDiscMainStatVal(rarity, statKey as any, level)
  return (
    <DiscStatRow
      label={statKeyTextMap[statKey as keyof typeof statKeyTextMap] ?? statKey}
      statKey={statKey}
      value={value}
      unit={getUnitStr(statKey as any)}
    />
  )
}
