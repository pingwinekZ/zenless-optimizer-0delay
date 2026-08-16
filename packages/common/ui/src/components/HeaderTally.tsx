import { Text } from '@mantine/core'
import type { ReactNode } from 'react'

export function Tally({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" style={{ opacity: 0.7, lineHeight: 1 }}>
      {children}
    </Text>
  )
}
