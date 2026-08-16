import { SegmentedControl, Text } from '@mantine/core'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export type StatDisplay = 'combat' | 'base'

export const StatsViewSelect = memo(function StatsViewSelect({
  value,
  onChange,
}: {
  value: StatDisplay
  onChange: (value: StatDisplay) => void
}) {
  const { t } = useTranslation('page_optimize')

  return (
    <SegmentedControl
      onChange={(v) => onChange(v as StatDisplay)}
      value={value}
      fullWidth
      size="xs"
      data={[
        {
          label: (
            <Text size="xs">
              {t('sidebar.combatStats', { defaultValue: 'Combat stats' })}
            </Text>
          ),
          value: 'combat' as const,
        },
        {
          label: (
            <Text size="xs">
              {t('sidebar.basicStats', { defaultValue: 'Basic stats' })}
            </Text>
          ),
          value: 'base' as const,
        },
      ]}
    />
  )
})
