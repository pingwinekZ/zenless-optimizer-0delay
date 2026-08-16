import type { HTMLAttributes } from 'react'

interface ColorTextProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string
}

export function ColorText({
  color,
  style,
  children,
  ...props
}: ColorTextProps) {
  return (
    <span
      style={{
        ...(color
          ? {
              color: color.startsWith('#')
                ? color
                : `var(--mantine-color-${color}-filled)`,
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
