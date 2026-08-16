import { Box, Group, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  AnalysisData,
  StatContribution,
} from './ExpandedDataPanelController'
import { buildStatContributions } from './ExpandedDataPanelController'

export function StatContributionChart({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { selectedStats } = analysisData

  const chartData = useMemo(() => {
    if (!selectedStats) return []
    return buildStatContributions(selectedStats)
  }, [selectedStats])

  if (chartData.length === 0) {
    return null
  }

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          DMG Stat Contribution
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Relative contribution of each stat to the build&apos;s damage
          potential
        </Text>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            barSize={24}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => Math.round(v).toString()}
              stroke="var(--text-secondary)"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
              stroke="var(--text-secondary)"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const entry = payload[0].payload as StatContribution
                return (
                  <Box
                    style={{
                      backgroundColor: 'var(--layer-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 12,
                    }}
                  >
                    <Text size="xs">{entry.name}</Text>
                    <Text size="xs" c="dimmed">
                      {formatStatDetail(entry)}
                    </Text>
                  </Box>
                )
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--mantine-color-blue-5)"
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        <Box mt="sm">
          {chartData.map((entry) => (
            <Group key={entry.key} gap="xs" wrap="nowrap" mb={2}>
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
                {formatStatDetail(entry)}
              </Text>
            </Group>
          ))}
        </Box>
      </Box>
    </CardThemed>
  )
}

function formatStatDetail(entry: StatContribution): string {
  if (entry.key === 'atk' || entry.key === 'impact') {
    return Math.round(entry.value).toLocaleString()
  }
  return `${entry.value.toFixed(1)}%`
}
