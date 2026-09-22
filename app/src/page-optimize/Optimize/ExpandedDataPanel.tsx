import { Flex, Loader, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { ActionBreakdown } from '../Analysis/ActionBreakdown'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { ReferenceComparison } from '../Analysis/ReferenceComparison'
import { StatsDiffCard } from '../Analysis/StatsDiffCard'
import { SubstatUpgrades } from '../Analysis/SubstatUpgrades'
import { TeammateUpgrades } from '../Analysis/TeammateUpgrades'
import { FilterContainer } from '../layout/FilterContainer'
import { FormRow } from '../layout/FormRow'
import { OptimizerMenuIds } from '../layout/optimizerMenuIds'

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: 4,
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flex: 1,
              }}
            >
              <div
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <StatsDiffCard analysisData={analysisData} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActionBreakdown analysisData={analysisData} />
                </div>
              </div>
              <div
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
              >
                {analysisData.referenceComparison && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ReferenceComparison analysisData={analysisData} />
                  </div>
                )}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <SubstatUpgrades analysisData={analysisData} />
                  <TeammateUpgrades analysisData={analysisData} />
                </div>
              </div>
            </div>
          </div>
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
