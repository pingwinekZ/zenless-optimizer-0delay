import { Divider, Flex } from '@mantine/core'
import React from 'react'

export const PermutationDisplay = React.memo(function PermutationDisplay({
  total,
  right,
  left,
}: {
  total?: number
  right: number
  left: string
}) {
  const rightText = total
    ? `${right.toLocaleString()} / ${total.toLocaleString()} - (${Math.ceil((right / total) * 100)}%)`
    : `${right.toLocaleString()}`
  return (
    <Flex justify="space-between">
      <div style={{ lineHeight: '24px' }}>{left}</div>
      <Divider
        style={{
          margin: 'auto 10px',
          flexGrow: 1,
          width: 'unset',
          minWidth: 'unset',
        }}
        variant="dashed"
      />
      <div style={{ lineHeight: '24px' }}>{rightText}</div>
    </Flex>
  )
})
