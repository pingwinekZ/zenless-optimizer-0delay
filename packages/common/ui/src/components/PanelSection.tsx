import type { ReactNode } from 'react'

export function PanelSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          fontSize: 24,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  )
}
