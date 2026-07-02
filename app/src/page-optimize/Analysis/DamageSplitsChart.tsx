import { Box, Group, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * A single damage split entry for the chart.
 */
export interface DamageSplitEntry {
  name: string
  value: number
  color: string
  type: string // 'basic', 'dash', 'special', 'ult', 'anomaly', etc.
}

/**
 * DamageSplitsChart - Horizontal stacked bar chart.
 * Shows damage distribution by ability type.
 *
 * TODO: Integrate with real calc data from the solver.
 * Currently renders with placeholder/mock data.
 */
export function DamageSplitsChart({ data }: { data?: DamageSplitEntry[] }) {
  // Placeholder mock data
  const chartData = useMemo(() => {
    const items = data ?? [
      { name: 'Basic ATK', value: 45000, color: '#4dabf7', type: 'basic' },
      { name: 'Dash ATK', value: 12000, color: '#74c0fc', type: 'dash' },
      { name: 'Special', value: 32000, color: '#38d9a9', type: 'special' },
      { name: 'Ultimate', value: 58000, color: '#fcc419', type: 'ult' },
      { name: 'Anomaly', value: 25000, color: '#ff6b6b', type: 'anomaly' },
    ]

    const total = items.reduce((sum, i) => sum + i.value, 0)
    return items.map((i) => ({
      ...i,
      percentage: total > 0 ? ((i.value / total) * 100).toFixed(1) : '0',
    }))
  }, [data])

  const totalDmg = chartData.reduce((sum, i) => sum + i.value, 0)

  // Format for horizontal stacked bar chart
  // Recharts horizontal bar chart needs data in a specific format
  const barData = useMemo(() => {
    const entry: Record<string, number | string> = { name: 'Damage' }
    chartData.forEach((item) => {
      entry[item.name] = item.value
    })
    return [entry]
  }, [chartData])

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          Damage Splits
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Total: {totalDmg.toLocaleString()} &mdash; {chartData.length} sources
        </Text>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={barData}
            layout="vertical"
            barSize={40}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
              }
              stroke="var(--text-secondary)"
            />
            <YAxis type="category" dataKey="name" hide />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {chartData.map((entry) => (
              <Bar
                key={entry.name}
                dataKey={entry.name}
                stackId="a"
                fill={entry.color}
                radius={[2, 2, 2, 2]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Data table */}
        <Box mt="sm">
          {chartData.map((entry) => (
            <Group key={entry.name} gap="xs" wrap="nowrap" mb={2}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: entry.color,
                  flexShrink: 0,
                }}
              />
              <Text size="xs" style={{ flex: 1 }}>
                {entry.name}
              </Text>
              <Text size="xs" style={{ textAlign: 'right', width: 80 }}>
                {entry.value.toLocaleString()}
              </Text>
              <Text
                size="xs"
                c="dimmed"
                style={{ textAlign: 'right', width: 50 }}
              >
                {entry.percentage}%
              </Text>
            </Group>
          ))}
        </Box>

        {/* TODO: Add custom tooltip on hover */}
        {/* TODO: Integrate with real solver calc data */}
      </Box>
    </CardThemed>
  )
}

/**
 * Custom tooltip component for the DamageSplitsChart.
 *
 * TODO: Implement proper tooltip with damage type details
 */
export function DamageSplitsTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
}) {
  if (!active || !payload?.length) return null

  return (
    <Box
      style={{
        backgroundColor: 'var(--layer-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 4,
        padding: '4px 8px',
      }}
    >
      {payload.map((entry) => (
        <Text key={entry.name} size="xs">
          {entry.name}: {entry.value.toLocaleString()}
        </Text>
      ))}
    </Box>
  )
}
