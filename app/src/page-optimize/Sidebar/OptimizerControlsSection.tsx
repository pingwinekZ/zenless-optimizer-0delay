import { Button, Flex, SegmentedControl, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBoltFilled, IconRefresh, IconX } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { OptimizerEngine } from '../../db'
import { ProgressDisplay } from './ProgressDisplay'
import type { StatDisplay } from './StatsViewSelect'
import { StatsViewSelect } from './StatsViewSelect'

const defaultGap = 5
const buttonStyle = { flex: 1 }
const startButtonStyle: React.CSSProperties = { flex: 1, minWidth: 211 }

export const OptimizerControlsSection = memo(function OptimizerControlsSection({
  isFullSize,
  optimizing,
  total,
  hasTarget,
  statDisplay,
  useTheoreticalMax,
  engine,
  onEngineChange,
  onOptimize,
  onCancel,
  onReset,
  onStatDisplayChange,
}: {
  isFullSize: boolean
  optimizing: boolean
  total: number
  hasTarget: boolean
  statDisplay: StatDisplay
  useTheoreticalMax?: boolean
  engine?: OptimizerEngine
  onEngineChange?: (engine: OptimizerEngine) => void
  onOptimize: (event: MouseEvent) => void
  onCancel: () => void
  onReset: () => void
  onStatDisplayChange: (value: StatDisplay) => void
}) {
  const { t } = useTranslation('page_optimize')

  return (
    <Flex direction={isFullSize ? 'column' : 'row'} gap={isFullSize ? 5 : 20}>
      {/* Controls group */}
      <Flex direction="column" gap={5}>
        <Text fw={700} size="sm">
          {t('sidebar.controls', 'Controls')}
        </Text>
        <Flex gap={defaultGap} direction="column">
          <Flex direction="column" gap={3}>
            <SegmentedControl
              value={engine ?? 'cpu'}
              onChange={(v) =>
                onEngineChange
                  ? onEngineChange(v as OptimizerEngine)
                  : undefined
              }
              data={[
                {
                  value: 'cpu',
                  label: t('sidebar.engine.cpu', 'CPU'),
                },
                {
                  value: 'gpu',
                  label: t('sidebar.engine.gpu', 'GPU'),
                },
              ]}
              fullWidth
              size="xs"
            />
            <Text size="xs" c="dimmed">
              {t(
                'sidebar.engine.hint',
                'GPU uses WebGPU and falls back to CPU when unavailable'
              )}
            </Text>
          </Flex>
          <Button
            leftSection={<IconBoltFilled size={16} />}
            loading={optimizing}
            onClick={onOptimize}
            disabled={(!total && !useTheoreticalMax) || !hasTarget}
            style={startButtonStyle}
          >
            {optimizing
              ? t('sidebar.optimizing', 'Optimizing...')
              : t('sidebar.startOptimizer', 'Start optimizer')}
          </Button>

          <Flex gap={defaultGap} justify="space-around">
            <Button
              variant="default"
              onClick={onCancel}
              style={buttonStyle}
              leftSection={<IconX size={16} />}
              disabled={!optimizing}
            >
              {t('sidebar.cancel', 'Cancel')}
            </Button>

            <Button
              variant="default"
              style={buttonStyle}
              onClick={() =>
                modals.openConfirmModal({
                  title: t('sidebar.resetConfirm.title', 'Reset Filters'),
                  children: t(
                    'sidebar.resetConfirm.description',
                    'Are you sure you want to reset all filters?'
                  ),
                  labels: {
                    confirm: t('sidebar.resetConfirm.yes', 'Yes'),
                    cancel: t('sidebar.resetConfirm.no', 'No'),
                  },
                  centered: true,
                  onConfirm: onReset,
                })
              }
              leftSection={<IconRefresh size={16} />}
            >
              {t('sidebar.reset', 'Reset')}
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Stat and filter view */}
      {isFullSize && (
        <Flex direction="column" gap={5}>
          <Text fw={700} size="sm">
            {t('sidebar.statView', 'Stat and filter view')}
          </Text>
          <StatsViewSelect value={statDisplay} onChange={onStatDisplayChange} />
        </Flex>
      )}

      {/* Progress display - shown in compact mode only (full-size sidebar shows it in PermutationsSection) */}
      {!isFullSize && <ProgressDisplay />}
    </Flex>
  )
})
