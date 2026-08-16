import { Badge } from '@mantine/core'
import type { HTMLAttributes } from 'react'

interface ColorTextProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string
}

export const SqBadge = ({
  color = 'primary',
  children,
  style,
  ...props
}: ColorTextProps) => (
  <Badge
    variant="filled"
    color={color}
    size="lg"
    style={{
      lineHeight: 1,
      whiteSpace: 'nowrap',
      verticalAlign: 'baseline',
      ...style,
    }}
    {...(props as any)}
  >
    {children}
  </Badge>
)
