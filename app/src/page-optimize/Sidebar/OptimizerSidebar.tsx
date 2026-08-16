import { Divider, Flex } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BuildsSection } from '../BuildManagement'
import { OptimizerControlsSection } from './OptimizerControlsSection'
import { PermutationsSection } from './PermutationsSection'
import { ResultsSection } from './ResultsSection'
import type { StatDisplay } from './StatsViewSelect'

const SCROLLBAR_WIDTH = 5
const RESERVED_SPACE = 2

export function OptimizerSidebar({
  optimizing,
  total,
  hasTarget,
  onOptimize,
  onCancel,
  onReset,
  onEquip,
  onFilter,
  onPin,
  onClearPins,
  statDisplay,
  onStatDisplayChange,
}: {
  optimizing: boolean
  total: number
  hasTarget: boolean
  statDisplay: StatDisplay
  onOptimize: (event: MouseEvent) => void
  onCancel: () => void
  onReset: () => void
  onEquip: () => void
  onFilter: () => void
  onPin: () => void
  onClearPins: () => void
  onStatDisplayChange: (value: StatDisplay) => void
}) {
  const { t } = useTranslation('page_optimize')
  const lg = useMediaQuery('(min-width: 992px)')
  const isFullSize = lg !== false

  const totalSideOffset = SCROLLBAR_WIDTH + RESERVED_SPACE

  return (
    <Flex
      direction="column"
      style={{ overflow: 'clip' }}
      role="region"
      aria-label={t(
        'aria.sidebarPanel',
        'Optimizer sidebar with controls and results'
      )}
    >
      <Flex
        justify={isFullSize ? 'center' : 'space-evenly'}
        style={
          isFullSize
            ? {
                position: 'sticky',
                top: 253,
                transform: 'translateY(-50%)',
                paddingLeft: 10,
                height: 150,
              }
            : {
                height: 121,
                overflow: 'clip',
                position: 'fixed',
                width: `calc(100% - ${2 * totalSideOffset}px)`,
                bottom: `${totalSideOffset}px`,
                left: `${totalSideOffset}px`,
                backgroundColor: 'var(--layer-2)',
                boxShadow: 'var(--shadow-card)',
                borderRadius: 6,
                padding: 16,
                zIndex: 3,
              }
        }
      >
        <Flex
          style={
            isFullSize
              ? {
                  borderRadius: 6,
                  backgroundColor: 'var(--layer-2)',
                  padding: 16,
                  height: 'fit-content',
                  width: 233,
                  boxShadow: 'var(--shadow-card)',
                  gap: 16,
                }
              : undefined
          }
        >
          <Flex
            direction={isFullSize ? 'column' : 'row'}
            gap={isFullSize ? 5 : 20}
          >
            <PermutationsSection isFullSize={isFullSize} />
            <OptimizerControlsSection
              isFullSize={isFullSize}
              optimizing={optimizing}
              total={total}
              hasTarget={hasTarget}
              statDisplay={statDisplay}
              onOptimize={onOptimize}
              onCancel={onCancel}
              onReset={onReset}
              onStatDisplayChange={onStatDisplayChange}
            />
            <ResultsSection
              isFullSize={isFullSize}
              onEquip={onEquip}
              onFilter={onFilter}
              onPin={onPin}
              onClearPins={onClearPins}
            />
            <Divider />
            <BuildsSection />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
