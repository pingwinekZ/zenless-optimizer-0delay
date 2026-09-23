import { Box, Flex, Table, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { StatIcon } from '@zenless-optimizer/zzz/svgicons'
import { useTranslation } from 'react-i18next'
import type { AnalysisData } from './ExpandedDataPanelController'
import { formatInt, formatPercent } from './format'
import classes from './UpgradeTable.module.css'

/**
 * "Substat Upgrades" — what one more substat roll of each substat buys on
 * the optimization target. hsr-optimizer simulates a roll into every
 * substat; the ZZZ payload arrives pre-computed (`statUpgrades`), grouped
 * by the metric the target measures.
 */
export function DamageUpgrades({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { t } = useTranslation('page_optimize', { keyPrefix: 'analysis' })
  const { statUpgrades } = analysisData

  if (statUpgrades.length === 0) return null

  return (
    <CardThemed>
      <Box p="md">
        <Text fw={700} size="sm">
          {t('substatUpgrades.title', 'Substat Upgrades')}
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          {t(
            'substatUpgrades.hint',
            'Gain from one additional roll of each substat on the selected build.'
          )}
        </Text>
        <Flex direction="column" gap="md">
          {statUpgrades.map((group) => (
            <Box key={group.metric}>
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                mb={4}
                tt="uppercase"
                style={{ letterSpacing: 0.6 }}
              >
                {t(`metrics.${group.metric}`, group.metric)}
              </Text>
              <Table className={classes.upgradeTable}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className={classes.substatHeader}>
                      {t('substatUpgrades.substat', 'Substat')}
                    </Table.Th>
                    <Table.Th className={classes.columnHeader}>
                      {t('substatUpgrades.percent', 'Gain %')}
                    </Table.Th>
                    <Table.Th className={classes.columnHeader}>
                      {t('substatUpgrades.value', 'Gain')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {group.upgrades.map((item) => (
                    <Table.Tr key={item.key}>
                      <Table.Td className={classes.centeredCell}>
                        <Flex align="center" gap={6} justify="center">
                          <StatIcon
                            statKey={item.key}
                            iconProps={{ style: { fontSize: 18 } }}
                          />
                          <Text size="xs">{item.label}</Text>
                        </Flex>
                      </Table.Td>
                      <Table.Td className={classes.centeredCell}>
                        <Text size="xs">{formatPercent(item.percent, 2)}</Text>
                      </Table.Td>
                      <Table.Td className={classes.centeredCell}>
                        <Text size="xs">{formatInt(item.value)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          ))}
        </Flex>
      </Box>
    </CardThemed>
  )
}
