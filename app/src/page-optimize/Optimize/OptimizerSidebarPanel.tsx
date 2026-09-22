import { Box, Stack } from '@mantine/core'
import { DeferCreate } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { GeneratedBuild, OptimizerEngine } from '@zenless-optimizer/zzz/db'
import type { MouseEvent } from 'react'
import { BuildsSection } from '../BuildManagement'
import { ResponsiveBottomBar } from '../layout'
import type { StatDisplay } from '../Sidebar'
import {
  OptimizerControlsSection,
  PermutationsSection,
  ResultsSection,
} from '../Sidebar'

/**
 * Right-column sidebar (desktop sticky) + bottom bar (mobile).
 * Pure presentational move from `Optimize/index.tsx`.
 */
export function OptimizerSidebarPanel({
  isMobileLayout,
  optimizing,
  totalPermutations,
  hasTarget,
  statDisplay,
  useTheoreticalMax,
  engine,
  resultLimit,
  selectedBuild,
  characterKey,
  onEngineChange,
  onOptimize,
  onCancel,
  onReset,
  onResultLimitChange,
  onStatDisplayChange,
  onEquip,
  onFilter,
  onPin,
  onClearPins,
}: {
  isMobileLayout: boolean
  optimizing: boolean
  totalPermutations: number
  hasTarget: boolean
  statDisplay: StatDisplay
  useTheoreticalMax: boolean
  engine: OptimizerEngine
  resultLimit: number
  selectedBuild: GeneratedBuild | undefined
  characterKey: CharacterKey
  onEngineChange: (engine: OptimizerEngine) => void
  onOptimize: (event: MouseEvent) => void
  onCancel: () => void
  onReset: () => void
  onResultLimitChange: (limit: number) => void
  onStatDisplayChange: (value: StatDisplay) => void
  onEquip: () => void
  onFilter: () => void
  onPin: () => void
  onClearPins: () => void
}) {
  return (
    <>
      {/* ─── Right Column: Sticky Sidebar (233px) ─── */}
      {!isMobileLayout && (
        <DeferCreate>
          <Box
            style={{
              position: 'sticky',
              top: 80,
              width: 233,
              alignSelf: 'flex-start',
              flexShrink: 0,
            }}
          >
            <Box
              style={{
                borderRadius: 6,
                backgroundColor: 'var(--layer-2)',
                padding: 16,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <Stack gap={5}>
                <PermutationsSection isFullSize={true} />
                <OptimizerControlsSection
                  isFullSize={true}
                  optimizing={optimizing}
                  total={totalPermutations}
                  hasTarget={hasTarget}
                  statDisplay={statDisplay}
                  useTheoreticalMax={useTheoreticalMax}
                  engine={engine}
                  resultLimit={resultLimit}
                  onEngineChange={onEngineChange}
                  onOptimize={onOptimize}
                  onCancel={onCancel}
                  onReset={onReset}
                  onResultLimitChange={onResultLimitChange}
                  onStatDisplayChange={onStatDisplayChange}
                />
                <ResultsSection
                  isFullSize={true}
                  onEquip={onEquip}
                  onFilter={onFilter}
                  onPin={onPin}
                  onClearPins={onClearPins}
                />
                <BuildsSection
                  isFullSize={true}
                  selectedBuild={selectedBuild}
                  characterKey={characterKey}
                />
              </Stack>
            </Box>
          </Box>
        </DeferCreate>
      )}

      {/* Mobile bottom bar */}
      {isMobileLayout && (
        <ResponsiveBottomBar
          optimizing={optimizing}
          total={totalPermutations}
          useTheoreticalMax={useTheoreticalMax}
          onOptimize={onOptimize}
          onCancel={onCancel}
          onReset={onReset}
        />
      )}
    </>
  )
}
