import { Box, Group, Table, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { discSetNames } from '../../consts'
import type { AnalysisData } from './ExpandedDataPanelController'

export function TeammateUpgrades({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { teammates, selectedDiscSetIds } = analysisData

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          Team Composition
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Current teammates and their loadout.
        </Text>

        {teammates.length === 0 ? (
          <Text size="xs" c="dimmed">
            No teammates configured. Add teammates in the team setup.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Teammate</Table.Th>
                <Table.Th>Disc Sets</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Mindscape</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teammates.map((tm) => (
                <Table.Tr key={tm.characterKey}>
                  <Table.Td>
                    <Text size="xs" fw={500}>
                      {tm.characterKey}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      {tm.discSetKeys.length > 0 ? (
                        tm.discSetKeys.map((set) => (
                          <Text key={set} size="xs" c="dimmed">
                            {discSetNames[set] ?? set}
                          </Text>
                        ))
                      ) : (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="xs">
                      {tm.mindscape > 0 ? `M${tm.mindscape}` : 'M0'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {selectedDiscSetIds.length > 0 && (
          <Box mt="sm">
            <Text size="xs" fw={600} mb={4}>
              Active Disc Sets
            </Text>
            <Group gap={4}>
              {selectedDiscSetIds.map((set) => (
                <Text key={set} size="xs" c="blue">
                  {discSetNames[set as keyof typeof discSetNames] ?? set}
                </Text>
              ))}
            </Group>
          </Box>
        )}
      </Box>
    </CardThemed>
  )
}
