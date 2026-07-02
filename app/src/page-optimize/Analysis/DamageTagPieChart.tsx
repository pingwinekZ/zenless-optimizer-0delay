import { Box, Group, Table, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { AnalysisData } from './ExpandedDataPanelController'

const PIE_COLORS = [
  '#4dabf7',
  '#fcc419',
  '#ff6b6b',
  '#38d9a9',
  '#da77f2',
  '#ff922b',
  '#d6336c',
]

type StatSlice = {
  name: string
  value: number
  color: string
  raw: string
}

export function DamageTagPieChart({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { selectedStats } = analysisData

  const slices = useMemo((): StatSlice[] => {
    if (!selectedStats) return []
    const items: StatSlice[] = [
      {
        name: 'ATK',
        value: selectedStats.atk,
        color: PIE_COLORS[0],
        raw: Math.round(selectedStats.atk).toLocaleString(),
      },
      {
        name: 'CRIT Rate',
        value: selectedStats.critRate * 100,
        color: PIE_COLORS[1],
        raw: `${(selectedStats.critRate * 100).toFixed(1)}%`,
      },
      {
        name: 'CRIT DMG',
        value: selectedStats.critDmg * 100,
        color: PIE_COLORS[2],
        raw: `${(selectedStats.critDmg * 100).toFixed(1)}%`,
      },
      {
        name: 'DMG%',
        value: selectedStats.dmgBonus * 100,
        color: PIE_COLORS[3],
        raw: `${(selectedStats.dmgBonus * 100).toFixed(1)}%`,
      },
      {
        name: 'PEN Ratio',
        value: selectedStats.penRatio * 100,
        color: PIE_COLORS[4],
        raw: `${(selectedStats.penRatio * 100).toFixed(1)}%`,
      },
      {
        name: 'Impact',
        value: selectedStats.impact,
        color: PIE_COLORS[5],
        raw: Math.round(selectedStats.impact).toLocaleString(),
      },
    ]
    const total = items.reduce((s, i) => s + i.value, 0)
    return items.map((i) => ({
      ...i,
      value: total > 0 ? (i.value / total) * 100 : 0,
    }))
  }, [selectedStats])

  if (slices.length === 0) return null

  const totalPct = 100

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          Stat Distribution
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Relative proportion of key combat stats
        </Text>

        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {slices.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${Number(value ?? 0).toFixed(1)}%`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'var(--layer-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>

        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Stat</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Value</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>%</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {slices.map((entry) => (
              <Table.Tr key={entry.name}>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: entry.color,
                        flexShrink: 0,
                      }}
                    />
                    <Text size="xs">{entry.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="xs">{entry.raw}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">
                    {entry.value.toFixed(1)}%
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr>
              <Table.Th>
                <Text size="xs" fw={700}>
                  Total
                </Text>
              </Table.Th>
              <Table.Th style={{ textAlign: 'right' }} />
              <Table.Th style={{ textAlign: 'right' }}>
                <Text size="xs" fw={700}>
                  {totalPct.toFixed(0)}%
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </Box>
    </CardThemed>
  )
}
