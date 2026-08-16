import { Button, CardSection, Flex, Group, Stack, Text } from '@mantine/core'
import { IconDeviceFloppy, IconRefresh, IconTrash } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * SimulationManager — provides Save / Overwrite / Delete All controls
 * for persisting simulation configurations.
 *
 * TODO: Wire these buttons to the database (SavedBuildDataManager or a new
 * SimulationDataManager) so simulations persist across sessions.
 */
export const SimulationManager = memo(function SimulationManager({
  hasUnsavedChanges,
  onSave,
  onOverwrite,
  onDeleteAll,
}: {
  hasUnsavedChanges?: boolean
  onSave?: () => void
  onOverwrite?: () => void
  onDeleteAll?: () => void
}) {
  const { t } = useTranslation('page_optimize')
  const [savedSims, setSavedSims] = useState<number>(0)

  const handleSave = useCallback(() => {
    // TODO: Persist the current simulation config to the database
    setSavedSims((s) => s + 1)
    onSave?.()
  }, [onSave])

  const handleOverwrite = useCallback(() => {
    // TODO: Overwrite the last saved simulation with current config
    onOverwrite?.()
  }, [onOverwrite])

  const handleDeleteAll = useCallback(() => {
    // TODO: Delete all persisted simulations from the database
    setSavedSims(0)
    onDeleteAll?.()
  }, [onDeleteAll])

  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap="xs" p="sm">
          <Text fw={700} size="sm">
            {t('simulation.simulationManager', 'Simulation Management')}
          </Text>

          <Text size="xs" c="dimmed">
            {savedSims > 0
              ? t('simulation.savedSims', {
                  count: savedSims,
                  defaultValue: '{count} simulation(s) saved',
                })
              : t('simulation.noSavedSims', 'No simulations saved yet')}
          </Text>

          <Flex gap="xs" wrap="wrap">
            <Button
              size="compact-sm"
              variant="light"
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={handleSave}
              color={hasUnsavedChanges ? 'yellow' : 'blue'}
            >
              {t('simulation.save', 'Save from Form')}
            </Button>
            <Button
              size="compact-sm"
              variant="subtle"
              leftSection={<IconRefresh size={14} />}
              onClick={handleOverwrite}
              disabled={savedSims === 0}
            >
              {t('simulation.overwrite', 'Overwrite')}
            </Button>
          </Flex>

          <Group>
            <Button
              size="compact-xs"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={12} />}
              onClick={handleDeleteAll}
              disabled={savedSims === 0}
            >
              {t('simulation.deleteAll', 'Delete All Simulations')}
            </Button>
          </Group>
        </Stack>
      </CardSection>
    </CardThemed>
  )
})
