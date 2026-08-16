import type { HTMLAttributes } from 'react'

export function HeaderText({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        textDecoration: 'underline',
        textDecorationColor: 'var(--color-accent)',
        textUnderlineOffset: 2,
        whiteSpace: 'nowrap',
        ...style,
      }}
    />
  )
}
