import { Flex, Text } from '@mantine/core'
import React from 'react'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import { calculateProgressText } from './sidebarUtils'

const SEGMENT_COUNT = 20

export const ProgressDisplay = React.memo(function ProgressDisplay() {
  const permutations = useOptimizerDisplayStore((s) => s.permutations)
  const permutationsSearched = useOptimizerDisplayStore(
    (s) => s.permutationsSearched
  )
  const optimizerStartTime = useOptimizerDisplayStore(
    (s) => s.optimizerStartTime
  )
  const optimizerEndTime = useOptimizerDisplayStore((s) => s.optimizerEndTime)
  const optimizationInProgress = useOptimizerDisplayStore(
    (s) => s.optimizationInProgress
  )
  const optimizerProgress = useOptimizerDisplayStore((s) => s.optimizerProgress)

  const progressText = calculateProgressText(
    optimizerStartTime,
    optimizerEndTime,
    permutations,
    permutationsSearched,
    optimizationInProgress,
    optimizerProgress
  )
  const progress = optimizerProgress
  const filledSegments = Math.round(progress * SEGMENT_COUNT)

  return (
    <Flex direction="column" gap={4}>
      <Text size="xs" c="dimmed">
        {progressText}
      </Text>
      <Flex gap={2}>
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 2,
              backgroundColor:
                i < filledSegments
                  ? 'var(--mantine-color-primary-3)'
                  : 'var(--border-default)',
            }}
          />
        ))}
      </Flex>
    </Flex>
  )
})
