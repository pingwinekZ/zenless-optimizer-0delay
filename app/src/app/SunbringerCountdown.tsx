import { Box, Group, Text } from '@mantine/core'
import { useEffect, useState } from 'react'

/**
 * Sunbringer (v3.4) release moment: Dec 02, 2026, 04:00 AM in Warsaw
 * (Europe/Warsaw is CET — UTC+1 — on that date; EU summer time ends on the
 * last Sunday of October 2026).
 */
export const RELEASE_TIME = new Date('2026-12-02T04:00:00+01:00').getTime()

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Slim banner rendered at the very top of every page counting down to the
 * Sunbringer release. Once the moment passes it switches to a short
 * "arrived" message (remove this component after the release if unwanted).
 */
export function SunbringerCountdown() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const released = now >= RELEASE_TIME
  const diff = RELEASE_TIME - now
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000) % 24
  const minutes = Math.floor(diff / 60_000) % 60
  const seconds = Math.floor(diff / 1000) % 60

  return (
    <Box
      bg="var(--mantine-primary-color-light)"
      c="var(--mantine-primary-color-text)"
      py={5}
      px={10}
      style={{
        borderBottom: '1px solid var(--mantine-primary-color-light-hover)',
      }}
    >
      <Group justify="center" gap={6} wrap="wrap">
        <Text size="sm" fw={600}>
          Sunbringer
          {released ? ' has arrived!' : ' releases in'}
        </Text>
        {!released && (
          <Text size="sm" fw={700} ff="monospace">
            {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </Text>
        )}
      </Group>
    </Box>
  )
}
