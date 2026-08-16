import { Group, Text } from '@mantine/core'
import type { ReactNode } from 'react'

export function CardHeaderCustom({
  avatar,
  title,
  action,
}: {
  avatar?: ReactNode
  title: ReactNode
  action?: ReactNode
}) {
  return (
    <Group gap="sm" p="md" wrap="nowrap">
      {avatar}
      <Text style={{ flexGrow: 1 }} fw={500}>
        {title}
      </Text>
      {action && <Text size="sm">{action}</Text>}
    </Group>
  )
}
