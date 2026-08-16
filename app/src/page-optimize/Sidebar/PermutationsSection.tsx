import { Flex, Text } from '@mantine/core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'
import { PermutationDisplay } from './PermutationDisplay'
import { ProgressDisplay } from './ProgressDisplay'

const slotLabels: Record<string, string> = {
  '1': 'Slot 1',
  '2': 'Slot 2',
  '3': 'Slot 3',
  '4': 'Slot 4',
  '5': 'Slot 5',
  '6': 'Slot 6',
}

export const PermutationsSection = React.memo(function PermutationsSection({
  isFullSize,
}: {
  isFullSize: boolean
}) {
  const permutationDetails = useOptimizerDisplayStore(
    (s) => s.permutationDetails
  )
  const permutations = useOptimizerDisplayStore((s) => s.permutations)
  const permutationsSearched = useOptimizerDisplayStore(
    (s) => s.permutationsSearched
  )
  const permutationsResults = useOptimizerDisplayStore(
    (s) => s.permutationsResults
  )
  const { t } = useTranslation('page_optimize')

  return (
    <Flex direction="column" gap={isFullSize ? 10 : 5} miw={211}>
      <Flex justify="space-between" align="center">
        <Text fw={700} size="sm">
          {t('sidebar.permutations', 'Permutations')}
        </Text>
      </Flex>

      {isFullSize && (
        <Flex direction="column">
          {Object.entries(permutationDetails).map(
            ([slot, { count, total }]) => (
              <PermutationDisplay
                key={slot}
                left={slotLabels[slot] ?? slot}
                right={count}
                total={total}
              />
            )
          )}
        </Flex>
      )}

      <Flex direction="column">
        <PermutationDisplay
          left={t('sidebar.perms', 'Perms')}
          right={permutations}
        />
        <PermutationDisplay
          left={t('sidebar.searched', 'Searched')}
          right={permutationsSearched}
        />
        <PermutationDisplay
          left={t('sidebar.results', 'Results')}
          right={permutationsResults}
        />
      </Flex>

      {isFullSize && <ProgressDisplay />}
    </Flex>
  )
})
