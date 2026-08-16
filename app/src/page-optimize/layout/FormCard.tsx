import { Flex } from '@mantine/core'
import type { CSSProperties, ReactNode } from 'react'

const defaultGap = 5
const defaultPadding = 11

const smallWidth = 226
const mediumWidth = 398
const largeWidth = 1258

const dimsBySize: Record<string, number> = {
  small: smallWidth,
  narrow: 248,
  medium: mediumWidth,
  large: largeWidth,
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
  const width = dimsBySize[size]

  return (
    <Flex
      className="hide-scrollbar"
      style={{
        borderRadius: 6,
        backgroundColor: 'var(--layer-2)',
        height: height ?? 415,
        padding: style?.padding ?? defaultPadding,
        boxShadow: 'var(--shadow-card)',
        overflow: style?.overflow,
      }}
    >
      <Flex style={{ width: width }} justify={justify}>
        <Flex
          direction="column"
          style={{ width: width }}
          gap={defaultGap}
          justify={justify}
        >
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
