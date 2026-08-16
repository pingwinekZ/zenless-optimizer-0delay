import { Button, Flex, Text } from '@mantine/core'
import React from 'react'
import { useTranslation } from 'react-i18next'

const defaultGap = 5
const buttonStyle: React.CSSProperties = { flex: 1 }

export const ResultsSection = React.memo(function ResultsSection({
  isFullSize,
  onEquip,
  onFilter,
  onPin,
  onClearPins,
}: {
  isFullSize: boolean
  onEquip: () => void
  onFilter: () => void
  onPin: () => void
  onClearPins: () => void
}) {
  const { t } = useTranslation('page_optimize')

  return (
    <Flex direction="column" gap={5}>
      <Text fw={700} size="sm">
        {t('sidebar.results', 'Results')}
      </Text>
      <Flex gap={isFullSize ? defaultGap : 8} justify="space-around">
        <Button onClick={onEquip} style={buttonStyle}>
          {t('sidebar.equip', 'Equip')}
        </Button>
        <Button variant="default" onClick={onFilter} style={buttonStyle}>
          {t('sidebar.filter', 'Filter')}
        </Button>
      </Flex>
      <Flex gap={isFullSize ? defaultGap : 8} justify="space-around">
        <Button variant="default" style={buttonStyle} onClick={onPin}>
          {t('sidebar.pin', 'Pin')}
        </Button>
        <Button variant="default" style={buttonStyle} onClick={onClearPins}>
          {t('sidebar.clearPins', 'Clear')}
        </Button>
      </Flex>
    </Flex>
  )
})
