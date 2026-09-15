import { Text } from '@mantine/core'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Fribbels-style header text: bold with an accent-colored underline.
 * Used in CharacterSelectorDisplay and OptimizerOptionsDisplay sections.
 */
export function HeaderText({
  children,
  style,
  className,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <Text
      fw={700}
      size="sm"
      className={className}
      style={{
        textDecoration: 'underline',
        textDecorationColor: 'var(--mantine-color-blue-6)',
        textUnderlineOffset: 2,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </Text>
  )
}
