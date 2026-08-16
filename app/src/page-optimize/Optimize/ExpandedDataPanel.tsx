import { ActionBreakdown } from '../Analysis/ActionBreakdown'
import type { AnalysisData } from '../Analysis/ExpandedDataPanelController'
import { StatsDiffCard } from '../Analysis/StatsDiffCard'
import { SubstatUpgrades } from '../Analysis/SubstatUpgrades'
import { TeammateUpgrades } from '../Analysis/TeammateUpgrades'
import { FilterContainer } from '../layout/FilterContainer'
import { FormRow } from '../layout/FormRow'
import { OptimizerMenuIds } from '../layout/optimizerMenuIds'

export function ExpandedDataPanel({
  analysisData,
}: {
  analysisData: AnalysisData | null
}) {
  if (!analysisData) return null

  return (
    <FilterContainer>
      <FormRow id={OptimizerMenuIds.analysis}>
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <StatsDiffCard analysisData={analysisData} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ActionBreakdown analysisData={analysisData} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
      </FormRow>
    </FilterContainer>
  )
}
