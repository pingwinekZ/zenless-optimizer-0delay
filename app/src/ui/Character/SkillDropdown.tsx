import { Menu } from '@mantine/core'
import { DropdownButton, ImgIcon } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { commonDefIcon } from '../../assets'
import type { SkillKey } from '../../consts'
import { skillByLevel } from '../../consts'
import { useCharacterContext, useDatabaseContext } from '../../db-ui'

export function SkillDropdown({ skillKey }: { skillKey: SkillKey }) {
  const { database } = useDatabaseContext()
  const { t } = useTranslation('page_characters')
  const character = useCharacterContext()
  const {
    [skillKey]: level = 0,
    key: characterKey,
    level: charLevel = 1,
  } = character ?? {}
  const setSkill = useCallback(
    (val: number) =>
      characterKey &&
      database.chars.set(characterKey, {
        [skillKey]: val,
      }),
    [database, characterKey, skillKey]
  )
  return (
    <DropdownButton
      fullWidth
      title={t(skillKey, { level: level })}
      color={'primary'}
      leftSection={
        <ImgIcon src={commonDefIcon(skillKey)} size={1.75} sideMargin />
      }
    >
      {range(1, skillByLevel(charLevel)).map((i) => (
        <Menu.Item key={i} disabled={level === i} onClick={() => setSkill(i)}>
          {t(skillKey, { level: i })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
