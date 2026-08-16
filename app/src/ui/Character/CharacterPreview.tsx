import { Box, Center, Flex, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import type { CharacterKey } from '../../consts'

export function CharacterPreview({
  characterKey,
}: {
  characterKey: CharacterKey | null
}) {
  return characterKey ? null : <PreviewPlaceholder />
}

function PreviewPlaceholder() {
  return (
    <Box
      style={{
        backgroundColor: 'var(--layer-2)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        width: '100%',
        minHeight: 400,
      }}
    >
      <Center h={400}>
        <Flex direction="column" align="center" gap={8} c="dark.2">
          <IconUser size={48} opacity={0.3} />
          <Text size="sm">Select a character</Text>
        </Flex>
      </Center>
    </Box>
  )
}
