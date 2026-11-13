import { Box, Checkbox, Stack, Title } from '@mantine/core'
import { ZCard } from '@zenless-optimizer/zzz/ui'

type RoadmapItem = {
  label: string
  done: boolean
}

// Edit this list to update the roadmap.
// Flip `done` to true to mark an item as complete.
const items: RoadmapItem[] = [{ label: 'Clean up any slop left', done: false }]

export function Roadmap() {
  return (
    <ZCard p="xl">
      <Box>
        <Title order={5}>
          <span role="img" aria-label="rocket">
            🚀
          </span>{' '}
          Roadmap
        </Title>
        <Stack gap={4} mt="xs">
          {items.map((item) => (
            <Checkbox
              key={item.label}
              label={item.label}
              checked={item.done}
              readOnly
              styles={{
                label: item.done
                  ? { textDecoration: 'line-through', opacity: 0.6 }
                  : undefined,
              }}
            />
          ))}
        </Stack>
      </Box>
    </ZCard>
  )
}
