import { Box, Button, Divider, Group, Switch, Text } from '@mantine/core'
import { IconPlugConnected, IconPlugConnectedX } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import {
  LIVE_IMPORT_URL,
  type LiveImportStatus,
  useLiveImport,
} from './useLiveImport'

function StatusBadge({ status }: { status: LiveImportStatus }) {
  switch (status) {
    case 'connected':
      return (
        <Button
          size="compact-xs"
          color="green"
          variant="light"
          leftSection={<IconPlugConnected size={14} />}
        >
          Connected
        </Button>
      )
    case 'connecting':
      return (
        <Button
          size="compact-xs"
          color="yellow"
          variant="light"
          leftSection={<IconPlugConnectedX size={14} />}
        >
          Connecting...
        </Button>
      )
    default:
      return (
        <Button
          size="compact-xs"
          color="gray"
          variant="light"
          leftSection={<IconPlugConnectedX size={14} />}
        >
          Disabled
        </Button>
      )
  }
}

export function LiveImportCard() {
  const { enabled, setEnabled, status, lastImport, lastImportAt } =
    useLiveImport()

  const time = lastImportAt ? new Date(lastImportAt).toLocaleTimeString() : ''
  const { result } = lastImport ?? {}

  return (
    <CardThemed bgt="light">
      <Box p="md" style={{ paddingBottom: 0 }}>
        <Group justify="space-between" wrap="wrap">
          <Text fw={700}>Live import</Text>
          <Group gap="sm">
            <StatusBadge status={status} />
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.currentTarget.checked)}
              label={enabled ? 'On' : 'Off'}
            />
          </Group>
        </Group>
      </Box>
      <Divider />
      <Box p="md" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Text size="sm" c="dimmed">
          Sync your database in real time from the ZZZ Packet Capture app. Start
          the game, enable &quot;Live export&quot; in the app, then turn this
          on.
        </Text>
        <Text size="xs" c="dimmed">
          Server: {LIVE_IMPORT_URL}
        </Text>
        {result && (
          <>
            <Divider />
            <Group gap="lg" wrap="wrap">
              <Text size="sm">
                Last import: <strong>{time}</strong>
              </Text>
              <Text size="sm">
                Discs: <strong>{result.discs.import}</strong> total,
                <strong> {result.discs.new.length}</strong> new,
                <strong> {result.discs.unchanged.length}</strong> unchanged,
                <strong> {result.discs.upgraded.length}</strong> upgraded,
                <strong> {result.discs.remove.length}</strong> removed
              </Text>
              <Text size="sm">
                DB total:{' '}
                <strong>
                  {result.discs.beforeMerge} -&gt; {lastImport?.dbTotal}
                </strong>
              </Text>
            </Group>
          </>
        )}
      </Box>
    </CardThemed>
  )
}
