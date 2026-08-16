import { Menu, Text } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { maxBuildsToShowList } from '../../db'
import { useDatabaseContext } from '../../db-ui'

export function BuildsSelector({
  maxBuildsToShow,
  optConfigId,
}: {
  maxBuildsToShow: number
  optConfigId: string
}) {
  const { database } = useDatabaseContext()
  const { t } = useTranslation('page_optimize')
  return (
    <DropdownButton title={t('build', { count: maxBuildsToShow })}>
      <Menu.Item>
        <Text size="xs" c="blue">
          {t('buildDropdownDesc')}
        </Text>
      </Menu.Item>
      {maxBuildsToShowList.map((n) => (
        <Menu.Item
          key={n}
          onClick={() =>
            database.optConfigs.set(optConfigId, { maxBuildsToShow: n })
          }
        >
          {t('build', { count: n })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
