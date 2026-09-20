import { Box, Text } from '@mantine/core'
import { ConditionalWrapper } from '@zenless-optimizer/common/ui'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { ZCard } from '../Components'
export const COMPACT_CARD_HEIGHT_PX = 165
export function EmptyCompactCard({
  placeholder,
  onClick,
}: {
  placeholder: string
  onClick?: () => void
}) {
  const wrapperFunc = useCallback(
    (children: ReactNode) => (
      <Box style={{ cursor: 'pointer' }} onClick={onClick}>
        {children}
      </Box>
    ),
    [onClick]
  )
  const falseWrapperFunc = useCallback(
    (children: ReactNode) => <Box>{children}</Box>,
    []
  )

  return (
    <ZCard bgt="dark">
      <ConditionalWrapper
        condition={!!onClick}
        wrapper={wrapperFunc}
        falseWrapper={falseWrapperFunc}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: `${COMPACT_CARD_HEIGHT_PX}px`,
          }}
        >
          <Text
            style={{
              textTransform: 'uppercase',
              color: 'var(--layer-2)',
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            {placeholder}
          </Text>
        </Box>
      </ConditionalWrapper>
    </ZCard>
  )
}
