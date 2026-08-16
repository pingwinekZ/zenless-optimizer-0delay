import { Button, Flex, Text } from '@mantine/core'
import {
  IconBoltFilled,
  IconPlayerStop,
  IconRefresh,
} from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * ResponsiveBottomBar — compact bottom action bar for mobile viewports.
 * Renders the core Optimize/Cancel/Reset controls inline so they remain
 * accessible without scrolling back to the sidebar.
 */
export const ResponsiveBottomBar = memo(function ResponsiveBottomBar({
  optimizing,
  total,
  useTheoreticalMax,
  onOptimize,
  onCancel,
  onReset,
}: {
  optimizing: boolean
  total: number
  useTheoreticalMax?: boolean
  onOptimize: (event: MouseEvent) => void
  onCancel: () => void
  onReset: () => void
}) {
  const { t } = useTranslation('page_optimize')

  return (
    <Flex
      gap="xs"
      align="center"
      justify="space-between"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        backgroundColor: 'var(--layer-1)',
        borderTop: 'var(--border-subtle)',
        padding: '8px 12px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <Text size="xs" c="dimmed">
        {total.toLocaleString()} {t('sidebar.perms', 'perms')}
      </Text>
      <Flex gap={6}>
        <Button
          size="compact-sm"
          leftSection={<IconBoltFilled size={14} />}
          loading={optimizing}
          onClick={onOptimize}
          disabled={!total && !useTheoreticalMax}
        >
          {optimizing
            ? t('sidebar.optimizing', 'Optimizing...')
            : t('sidebar.startOptimizer', 'Optimize')}
        </Button>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<IconPlayerStop size={14} />}
          onClick={onCancel}
          disabled={!optimizing}
          aria-label={t('sidebar.cancel', 'Cancel')}
        >
          {t('sidebar.cancel', 'Cancel')}
        </Button>
        <Button
          size="compact-sm"
          variant="subtle"
          leftSection={<IconRefresh size={14} />}
          onClick={onReset}
          aria-label={t('sidebar.reset', 'Reset')}
        />
      </Flex>
    </Flex>
  )
})
