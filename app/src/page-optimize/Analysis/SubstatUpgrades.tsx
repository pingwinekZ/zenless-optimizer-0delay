import { Box, Table, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import type { AnalysisData } from './ExpandedDataPanelController'

export function SubstatUpgrades({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { selectedDiscSubstats } = analysisData

  const displayData = useMemo(() => {
    return [...selectedDiscSubstats].sort((a, b) => b.totalRolls - a.totalRolls)
  }, [selectedDiscSubstats])

  if (displayData.length === 0) {
    return (
      <CardThemed>
        <Box p="md">
          <Text fw={700} size="sm" mb="xs">
            Substat Distribution
          </Text>
          <Text size="xs" c="dimmed">
            No substat data available for the selected build.
          </Text>
        </Box>
      </CardThemed>
    )
  }

  const totalRolls = displayData.reduce((s, d) => s + d.totalRolls, 0)

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          Substat Distribution
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Aggregated substat rolls across all 6 discs. {totalRolls} total rolls.
        </Text>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Substat</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Rolls</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Per Roll</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {displayData.map((entry) => (
              <Table.Tr key={entry.key}>
                <Table.Td>
                  <Text size="xs" fw={500}>
                    {entry.key.endsWith('_') ? `${entry.label} %` : entry.label}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="xs">{entry.totalRolls}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="xs" c="green">
                    +{formatRollValue(entry.perRollValue, entry.key)}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="xs" fw={600}>
                    {formatRollValue(entry.totalValue, entry.key)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </CardThemed>
  )
}

function formatRollValue(value: number, key: string): string {
  const isPercent = key.endsWith('_')
  if (isPercent) {
    return `${(value * 100).toFixed(1)}%`
  }
  return Math.round(value).toString()
}
