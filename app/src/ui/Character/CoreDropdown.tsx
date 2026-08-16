import { Menu } from '@mantine/core'
import { DropdownButton, ImgIcon } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { commonDefIcon } from '../../assets'
import { coreByLevel } from '../../consts'
import { useCharacterContext, useDatabaseContext } from '../../db-ui'

export function CoreDropdown() {
  const { t } = useTranslation('page_characters')
  const { database } = useDatabaseContext()
  const character = useCharacterContext()
  const { core = 0, key: characterKey, level = 1 } = character ?? {}
  const setCore = useCallback(
    (val: number) =>
      characterKey &&
      database.chars.set(characterKey, {
        core: val,
      }),
    [database, characterKey]
  )
  return (
    <DropdownButton
      fullWidth
      title={t('core', { level: core })}
      color={'primary'}
      leftSection={
        <ImgIcon src={commonDefIcon('core')} size={1.75} sideMargin />
      }
    >
      {range(0, coreByLevel(level)).map((i) => (
        <Menu.Item key={i} disabled={core === i} onClick={() => setCore(i)}>
          {t('core', { level: i })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
