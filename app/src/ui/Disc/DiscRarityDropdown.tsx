import type { ButtonProps } from '@mantine/core'
import { Menu } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import type { DiscRarityKey } from '../../consts'
import { allDiscRarityKeys } from '../../consts'

type props = ButtonProps & {
  rarity?: DiscRarityKey
  onRarityChange: (rarity: DiscRarityKey) => void
  filter?: (rarity: DiscRarityKey) => boolean
}

export function DiscRarityDropdown({
  rarity,
  onRarityChange,
  filter,
  ...props
}: props) {
  const { t } = useTranslation('disc')
  return (
    <DropdownButton
      {...props}
      title={rarity ?? t('editor.rarity')}
      color={rarity ? 'success' : 'primary'}
    >
      {allDiscRarityKeys.map((rarity) => (
        <Menu.Item
          key={rarity}
          disabled={filter ? !filter?.(rarity) : false}
          onClick={() => onRarityChange(rarity)}
        >
          {rarity}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
