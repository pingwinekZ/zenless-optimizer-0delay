import type { CardProps } from '@mantine/core'
import { Card } from '@mantine/core'

export type CardBackgroundColor = 'light' | 'dark' | 'normal'

const bgMap = {
  light: 'var(--layer-3)',
  dark: 'var(--layer-1)',
  normal: 'var(--layer-2)',
} as const

interface StyledCardProps extends CardProps {
  bgt?: CardBackgroundColor
}

export function ZCard({ bgt = 'normal', style, ...props }: StyledCardProps) {
  return (
    <Card
      style={{
        backgroundColor: bgMap[bgt],
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
      {...props}
    />
  )
}
