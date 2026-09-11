import { Button, Flex, SegmentedControl, Select, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBoltFilled, IconRefresh, IconX } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { OptimizerEngine } from '../../db'
import { maxBuildsToShowList } from '../../db'
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
  resultLimit,
  onEngineChange,
  onOptimize,
  onCancel,
  onReset,
  onResultLimitChange,
  onStatDisplayChange,
}: {
  isFullSize: boolean
  optimizing: boolean
  total: number
  hasTarget: boolean
  statDisplay: StatDisplay
  useTheoreticalMax?: boolean
  engine?: OptimizerEngine
  resultLimit?: number
  onEngineChange?: (engine: OptimizerEngine) => void
  onOptimize: (event: MouseEvent) => void
  onCancel: () => void
  onReset: () => void
  onResultLimitChange?: (limit: number) => void
  onStatDisplayChange: (value: StatDisplay) => void
}) {
  const { t } = useTranslation('page_optimize')
  const missingTarget = !hasTarget
  const noBuilds = !total && !useTheoreticalMax
  const startDisabled = missingTarget || noBuilds

  return (
    <Flex direction={isFullSize ? 'column' : 'row'} gap={isFullSize ? 5 : 20}>
      {/* Controls group */}
      <Flex direction="column" gap={5}>
        <Text fw={700} size="sm">
          {t('sidebar.controls', 'Controls')}
        </Text>
        <Flex gap={defaultGap} direction="column">
          <SegmentedControl
            value={engine ?? 'cpu'}
            onChange={(v) =>
              onEngineChange ? onEngineChange(v as OptimizerEngine) : undefined
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
          <Flex direction="column" gap={3}>
            <Text size="xs" c="dimmed">
              {t('sidebar.resultLimit', 'Find top results')}
            </Text>
            <Select
              data={maxBuildsToShowList.map((v) => ({
                value: String(v),
                label: `Top ${v}`,
              }))}
              value={resultLimit != null ? String(resultLimit) : undefined}
              onChange={(val) => {
                if (val != null && onResultLimitChange)
                  onResultLimitChange(Number(val))
              }}
              placeholder={t('sidebar.resultLimit', 'Find top results')}
              size="xs"
            />
          </Flex>
          <Button
            leftSection={<IconBoltFilled size={16} />}
            loading={optimizing}
            onClick={onOptimize}
            disabled={startDisabled}
            style={startButtonStyle}
          >
            {optimizing
              ? t('sidebar.optimizing', 'Optimizing...')
              : t('sidebar.startOptimizer', 'Start optimizer')}
          </Button>
          {startDisabled && !optimizing && (
            <Flex direction="column" gap={2}>
              {missingTarget && (
                <Text size="xs" c="orange" style={{ lineHeight: 1.3 }}>
                  {t(
                    'sidebar.startDisabled.noTarget',
                    'Select an optimization target to enable the optimizer.'
                  )}
                </Text>
              )}
              {noBuilds && (
                <Text size="xs" c="orange" style={{ lineHeight: 1.3 }}>
                  {t(
                    'sidebar.startDisabled.noBuilds',
                    'No discs or W-Engines to optimize — add discs and select a W-Engine.'
                  )}
                </Text>
              )}
            </Flex>
          )}

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
