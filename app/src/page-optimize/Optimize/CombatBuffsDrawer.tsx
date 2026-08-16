import { Drawer, ScrollArea, Stack, Text } from '@mantine/core'
import { BonusStatsSection } from '../BonusStats'

export function CombatBuffsDrawer({
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
      title="Combat Buffs"
      position="right"
      size="xl"
      padding="md"
    >
      <ScrollArea style={{ height: 'calc(100vh - 100px)' }}>
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Configure bonus stats that apply during combat, such as team buffs,
            food buffs, or external buffs.
          </Text>
          <BonusStatsSection />
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
