import { Drawer, ScrollArea, Stack, Text } from '@mantine/core'
import { EnemyStatsSection } from '../EnemyStats'

export function EnemyConfigDrawer({
  show,
  onClose,
}: {
  show: boolean
  onClose: () => void
}) {
  return (
    <Drawer
      opened={show}
      onClose={onClose}
      title="Enemy Configuration"
      position="right"
      size="xl"
      padding="md"
    >
      <ScrollArea style={{ height: 'calc(100vh - 100px)' }}>
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Configure enemy level, DEF, resistances, and weaknesses.
          </Text>
          <EnemyStatsSection />
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
