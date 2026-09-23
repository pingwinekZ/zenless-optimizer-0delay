import { Box, Flex, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { optTargetLabel } from './actionLabel'
import { DamageSplitsChart } from './DamageSplitsChart'
import type { DamageSplitEntry } from './damageSplitUtils'
import { extractDamageSplits } from './damageSplitUtils'
import type { AnalysisData } from './ExpandedDataPanelController'

const LEGEND_SWATCH = 10

/**
 * "Combo Breakdown": the damage of every action in the current optimization
 * target, one bar each, colored by damage type. hsr-optimizer additionally
 * toggles between a default and a rotation action set; ZZZ resolves the
 * target into that action list up front (`perActionDamage`), so the chart
 * renders it directly.
 */
export function DamageSplits({ analysisData }: { analysisData: AnalysisData }) {
  const { t } = useTranslation('page_optimize', { keyPrefix: 'analysis' })
  const entries = extractDamageSplits(
    analysisData.targetInfo?.perActionDamage ?? [],
    optTargetLabel
  )

  if (entries.length === 0) return null

  const legend = collectLegend(entries)

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          {t('damageSplits.title', 'Combo Breakdown')}
        </Text>
        <DamageSplitsChart entries={entries} />
        {legend.length > 1 && (
          <Flex gap="md" wrap="wrap" mt="xs" justify="center">
            {legend.map((item) => (
              <Flex key={item.damageType} align="center" gap={6}>
                <Box
                  style={{
                    width: LEGEND_SWATCH,
                    height: LEGEND_SWATCH,
                    borderRadius: 2,
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" c="dimmed">
                  {item.label}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </CardThemed>
  )
}

/** Distinct damage types across the bars, in first-seen order. */
function collectLegend(entries: DamageSplitEntry[]) {
  const seen = new Map<
    string,
    { damageType: string; label: string; color: string }
  >()
  for (const entry of entries) {
    for (const segment of entry.segments) {
      if (seen.has(segment.damageType)) continue
      seen.set(segment.damageType, {
        damageType: segment.damageType,
        label: segment.label,
        color: segment.color,
      })
    }
  }
  return Array.from(seen.values())
}
