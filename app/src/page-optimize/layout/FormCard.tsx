import { Flex } from '@mantine/core'
import type { CSSProperties, ReactNode } from 'react'

const defaultGap = 5
const defaultPadding = 11

const dimsBySize: Record<string, { minWidth: number }> = {
  small: { minWidth: 200 },
  narrow: { minWidth: 220 },
  medium: { minWidth: 350 },
  large: { minWidth: 600 },
}

export function FormCard({
  size: sizeProp,
  children,
  height,
  style,
  justify,
}: {
  size?: string
  children?: ReactNode
  height?: number
  style?: CSSProperties
  justify?: string
}) {
  const size = sizeProp ?? 'small'
  const { minWidth } = dimsBySize[size]

  return (
    <Flex
      className="hide-scrollbar"
      style={{
        flex: 1,
        minWidth,
        borderRadius: 6,
        backgroundColor: 'var(--layer-2)',
        height: height ?? 415,
        padding: style?.padding ?? defaultPadding,
        boxShadow: 'var(--shadow-card)',
        overflow: style?.overflow,
      }}
    >
      <Flex style={{ flex: 1, minWidth: 0 }} justify={justify}>
        <Flex
          direction="column"
          style={{ flex: 1, minWidth: 0 }}
          gap={defaultGap}
          justify={justify}
        >
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
