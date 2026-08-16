import type { CardProps } from '@mantine/core'
import { Card } from '@mantine/core'

export type CardBackgroundColor = 'light' | 'dark' | 'normal'
const bgMap = {
  light: 'var(--layer-3)',
  dark: 'var(--layer-1)',
  normal: 'var(--layer-2)',
} as const

interface StyledCardProps extends CardProps {
  bgt?: CardBackgroundColor | string
}

export function CardThemed({ bgt, style, ...props }: StyledCardProps) {
  const bg =
    bgt && bgt in bgMap ? bgMap[bgt as CardBackgroundColor] : 'var(--layer-2)'
  return (
    <Card
      style={{
        backgroundColor: bg,
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
      {...props}
    />
  )
}
