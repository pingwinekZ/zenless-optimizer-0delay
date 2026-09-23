import { Box, Flex, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DamageTagSlice } from './damageSplitUtils'
import { extractDamageByTag } from './damageSplitUtils'
import type { AnalysisData } from './ExpandedDataPanelController'
import { formatInt } from './format'

const PIE_HEIGHT = 240
const OUTER_RADIUS = 92
const INNER_RADIUS = 58

const TOOLTIP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--layer-3)',
  border: '1px solid var(--border-default)',
  padding: 8,
  borderRadius: 6,
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: DamageTagSlice }>
}) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <Box style={TOOLTIP_STYLE}>
      <Text size="xs" fw={700}>
        {slice.label}
      </Text>
      <Text size="xs">{formatInt(slice.value)}</Text>
      <Text size="xs" c="dimmed">
        {(slice.percent * 100).toFixed(1)}%
      </Text>
    </Box>
  )
}

/** Damage distribution across the target's damage types. */
export function DamageTagPieChart({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { t } = useTranslation('page_optimize', { keyPrefix: 'analysis' })
  const slices = useMemo(
    () => extractDamageByTag(analysisData.targetInfo?.perActionDamage ?? []),
    [analysisData.targetInfo]
  )

  if (slices.length === 0) return null

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm" mb="xs">
          {t('damageTag.title', 'Damage Distribution')}
        </Text>
        <ResponsiveContainer width="100%" height={PIE_HEIGHT}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={OUTER_RADIUS}
              innerRadius={INNER_RADIUS}
              stroke="var(--layer-2)"
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.damageType} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <Flex direction="column" gap={4}>
          {slices.map((slice) => (
            <Flex key={slice.damageType} align="center" gap={6}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: slice.color,
                  flexShrink: 0,
                }}
              />
              <Text size="xs" style={{ flex: 1 }}>
                {slice.label}
              </Text>
              <Text size="xs" c="dimmed">
                {(slice.percent * 100).toFixed(1)}%
              </Text>
              <Text size="xs" style={{ width: 80, textAlign: 'right' }}>
                {formatInt(slice.value)}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>
    </CardThemed>
  )
}
