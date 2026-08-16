import type { TooltipProps } from '@mantine/core'
import { Tooltip } from '@mantine/core'

export function BootstrapTooltip({ children, ...props }: TooltipProps) {
  return (
    <Tooltip
      {...props}
      styles={{
        tooltip: {
          backgroundColor: 'var(--mantine-color-dark-9)',
          color: 'var(--mantine-color-white)',
          maxWidth: 500,
        },
        arrow: { backgroundColor: 'var(--mantine-color-dark-9)' },
      }}
    >
      {children}
    </Tooltip>
  )
}
