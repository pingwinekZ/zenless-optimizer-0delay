import { Divider, type DividerProps, Flex } from '@mantine/core'

export function VerticalDivider({ width = 10 }: { width?: number }) {
  return (
    <Flex direction="column">
      <Divider
        orientation="vertical"
        style={{ flexGrow: 1, margin: `10px ${width}px` }}
      />
    </Flex>
  )
}

export const HorizontalDivider = (props: DividerProps) => (
  <Divider my={5} {...props} />
)
