import { Flex, Loader, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { ActionBreakdown } from '../Analysis/ActionBreakdown'
import { DamageSplits } from '../Analysis/DamageSplits'
import { DamageTagPieChart } from '../Analysis/DamageTagPieChart'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { ReferenceComparison } from '../Analysis/ReferenceComparison'
import { StatsDiffCard } from '../Analysis/StatsDiffCard'
import { DamageUpgrades } from '../Analysis/SubstatUpgrades'
import { FilterContainer } from '../layout/FilterContainer'
import { FormRow } from '../layout/FormRow'
import { OptimizerMenuIds } from '../layout/optimizerMenuIds'

/**
 * "Optimization results analysis": stats diff + action breakdown stacked,
 * then damage pies above the upgrade tables.
 */
export function ExpandedDataPanel({
  analysisData,
  isComputingAnalysis,
}: {
  analysisData: AnalysisData | null
  isComputingAnalysis: boolean
}) {
  const { t } = useTranslation('page_optimize')

  // The payload is built off the render path (see `useBuildAnalysis`), so keep
  // the row mounted while the first one is in flight — otherwise the whole
  // section pops in seconds after the page has settled. No payload and nothing
  // running means the target has no attributable action (e.g. no opt target).
  if (!analysisData && !isComputingAnalysis) return null

  return (
    <FilterContainer>
      <FormRow id={OptimizerMenuIds.analysis}>
        {analysisData ? (
          <Flex justify="space-between" gap={10} w="100%" pt={4} wrap="wrap">
            <Flex direction="column" gap={10} style={{ flex: 1, minWidth: 0 }}>
              <Flex gap={10} align="flex-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <StatsDiffCard analysisData={analysisData} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActionBreakdown analysisData={analysisData} />
                </div>
              </Flex>
              <DamageSplits analysisData={analysisData} />
              <Flex gap={10} align="flex-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DamageTagPieChart analysisData={analysisData} />
                </div>
                <Flex
                  direction="column"
                  gap={10}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <DamageUpgrades analysisData={analysisData} />
                </Flex>
              </Flex>
              <ReferenceComparison analysisData={analysisData} />
            </Flex>
          </Flex>
        ) : (
          <Flex align="center" gap={8} py={4}>
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {t('analysis.computing', 'Computing analysis...')}
            </Text>
          </Flex>
        )}
      </FormRow>
    </FilterContainer>
  )
}
