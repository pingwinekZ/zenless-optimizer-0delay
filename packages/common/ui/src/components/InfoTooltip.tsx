import type { TooltipProps } from '@mantine/core'
import { ActionIcon } from '@mantine/core'
import { BootstrapTooltip } from './BootstrapTooltip'

export function InfoTooltip(props: Omit<TooltipProps, 'children'>) {
  return (
    <BootstrapTooltip {...props}>
      <ActionIcon variant="subtle" color="gray" style={{ cursor: 'help' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </ActionIcon>
    </BootstrapTooltip>
  )
}

export function InfoTooltipInline(props: Omit<TooltipProps, 'children'>) {
  return (
    <BootstrapTooltip {...props}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="xs"
        style={{
          cursor: 'help',
          verticalAlign: '-10%',
          display: 'inline-flex',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </ActionIcon>
    </BootstrapTooltip>
  )
}
