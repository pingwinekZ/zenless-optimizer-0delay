import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CardSection,
  Divider,
  Flex,
  Group,
  Stack,
  Switch,
  Table,
  Text,
} from '@mantine/core'
import {
  IconPlayerPlay,
  IconPlus,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'

/**
 * StatSimulationDisplay — main toggle + simulated builds overview grid.
 *
 * TODO: Connect simulation state to the database and optimizer solver
 * so that simulated builds can be scored against the current character.
 */
export const StatSimulationDisplay = memo(function StatSimulationDisplay() {
  const { t } = useTranslation('page_optimize')
  const enabled = useOptimizerDisplayStore((s) => s.simulationEnabled)
  const setEnabled = useOptimizerDisplayStore((s) => s.setSimulationEnabled)

  // Placeholder simulated builds
  const [simulatedBuilds, setSimulatedBuilds] = useState<
    { name: string; value: number }[]
  >([])

  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap="xs" p="sm">
          {/* Header row: title + on/off toggle */}
          <Flex justify="space-between" align="center">
            <Group gap={4}>
              <IconSettings size={16} />
              <Text fw={700} size="sm">
                {t('simulation.title', 'Stat Simulation')}
              </Text>
              <Badge
                size="sm"
                color={enabled ? 'green' : 'gray'}
                variant="light"
              >
                {enabled ? 'ON' : 'OFF'}
              </Badge>
            </Group>
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.currentTarget.checked)}
              size="xs"
              aria-label={t('simulation.toggle', 'Toggle simulation mode')}
            />
          </Flex>

          {enabled && (
            <>
              <Divider />

              {/* Action buttons */}
              <Group gap="xs">
                <Button
                  size="compact-sm"
                  variant="light"
                  leftSection={<IconPlayerPlay size={14} />}
                  onClick={() => {
                    // TODO: Trigger simulation scoring
                    setSimulatedBuilds((prev) => [
                      ...prev,
                      {
                        name: `Sim #${prev.length + 1}`,
                        value: Math.random() * 10000,
                      },
                    ])
                  }}
                >
                  {t('simulation.simulate', 'Simulate')}
                </Button>
                <Button
                  size="compact-sm"
                  variant="subtle"
                  leftSection={<IconPlus size={14} />}
                >
                  {t('simulation.import', 'Import')}
                </Button>
                <Button
                  size="compact-sm"
                  variant="subtle"
                  leftSection={<IconSettings size={14} />}
                >
                  {t('simulation.conditionals', 'Conditionals')}
                </Button>
              </Group>

              {/* Simulated builds grid */}
              {simulatedBuilds.length > 0 && (
                <Box>
                  <Text size="xs" fw={600} mb={4}>
                    {t('simulation.simulatedBuilds', 'Simulated Builds')}
                  </Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('simulation.name', 'Name')}</Table.Th>
                        <Table.Th>{t('simulation.value', 'Value')}</Table.Th>
                        <Table.Th>
                          {t('simulation.actions', 'Actions')}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {simulatedBuilds.map((build, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>
                            <Text size="xs">{build.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {build.value.toLocaleString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={2}>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => {
                                  setSimulatedBuilds((prev) =>
                                    prev.filter((_, j) => j !== i)
                                  )
                                }}
                                aria-label={t('simulation.delete', 'Delete')}
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  <Group justify="flex-end" mt="xs">
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      leftSection={<IconTrash size={12} />}
                      onClick={() => setSimulatedBuilds([])}
                    >
                      {t('simulation.deleteAll', 'Delete All')}
                    </Button>
                  </Group>
                </Box>
              )}
            </>
          )}
        </Stack>
      </CardSection>
    </CardThemed>
  )
})
