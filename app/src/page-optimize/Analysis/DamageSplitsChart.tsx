import { Box, Text } from '@mantine/core'
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DamageSplitEntry } from './damageSplitUtils'
import { formatInt } from './format'

const CHART_COLOR = '#DDD'
const BAR_HEIGHT = 34
const CHART_PADDING = 24
const MIN_LABEL_WIDTH = 90
const MAX_LABEL_WIDTH = 220

const TOOLTIP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  background: 'var(--layer-3)',
  border: '1px solid var(--border-default)',
  padding: 8,
  borderRadius: 6,
}

type BarDatum = {
  name: string
  nameColor?: string
  value: number
  color: string
  label: string
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: BarDatum }>
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null
  return (
    <Box style={TOOLTIP_STYLE}>
      <Text
        size="xs"
        fw={700}
        style={datum.nameColor ? { color: datum.nameColor } : undefined}
      >
        {datum.name}
      </Text>
      <Text size="xs" c="dimmed">
        {datum.label}
      </Text>
      <Text size="xs">{formatInt(datum.value)}</Text>
    </Box>
  )
}

/** Y-axis tick mirroring the combo card's attack-name coloring. */
function NameTick({
  x,
  y,
  payload,
  colors,
}: {
  x?: number
  y?: number
  payload?: { value?: string | number }
  colors: Map<string, string>
}) {
  const name = String(payload?.value ?? '')
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={12}
      style={{ fill: colors.get(name) ?? CHART_COLOR }}
    >
      {name}
    </text>
  )
}

/**
 * Horizontal bar per action, colored by damage type. hsr-optimizer stacks
 * one bar per damage-tag segment; a ZZZ action resolves to a single
 * damage figure, so each bar is a single colored segment carrying the
 * action total.
 */
export function DamageSplitsChart({
  entries,
}: {
  entries: DamageSplitEntry[]
}) {
  const data = useMemo<BarDatum[]>(
    () =>
      entries.map((entry) => {
        const segment = entry.segments[0]
        return {
          name: entry.name,
          nameColor: entry.nameColor,
          value: entry.total,
          color: segment?.color ?? CHART_COLOR,
          label: segment?.label ?? '',
        }
      }),
    [entries]
  )

  const nameColors = useMemo(() => {
    const map = new Map<string, string>()
    for (const datum of data)
      if (datum.nameColor) map.set(datum.name, datum.nameColor)
    return map
  }, [data])

  const labelWidth = useMemo(() => {
    const longest = data.reduce((max, d) => Math.max(max, d.name.length), 0)
    return Math.min(MAX_LABEL_WIDTH, Math.max(MIN_LABEL_WIDTH, longest * 7))
  }, [data])

  const height = data.length * BAR_HEIGHT + CHART_PADDING

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 64, left: 0, bottom: 4 }}
        barCategoryGap="25%"
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={labelWidth}
          tick={<NameTick colors={nameColors} />}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
          content={<ChartTooltip />}
        />
        <Bar dataKey="value" maxBarSize={BAR_HEIGHT} isAnimationActive={false}>
          {data.map((datum) => (
            <Cell key={datum.name} fill={datum.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fill: CHART_COLOR, fontSize: 12 }}
            formatter={(value: unknown) => formatInt(Number(value))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
