import { Badge, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { ImgIcon, SolidColoredToggleButton } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import { type ReactNode, useCallback, useMemo } from 'react'
import { rarityDefIcon } from '../../assets'
import type { CharacterRarityKey } from '../../consts'
import { allCharacterRarityKeys } from '../../consts'

type CharacterRarityToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: CharacterRarityKey[]) => void
  value: CharacterRarityKey[]
  totals: Record<CharacterRarityKey, ReactNode>
}

export function CharacterRarityToggle({
  value,
  totals,
  onChange,
  ...props
}: CharacterRarityToggleProps) {
  const xs = !useMediaQuery('(min-width: 600px)')
  const rarityHandler = useMemo(
    () => handleMultiSelect([...allCharacterRarityKeys]),
    []
  )
  const handleClick = useCallback(
    (key: CharacterRarityKey) => () => onChange(rarityHandler(value, key)),
    [onChange, rarityHandler, value]
  )
  return (
    <Group {...(props as any)} gap="xs">
      {allCharacterRarityKeys.map((rKey) => (
        <SolidColoredToggleButton
          key={rKey}
          value={rKey}
          selected={value.includes(rKey)}
          style={{
            padding: xs ? 4 : undefined,
            minWidth: xs ? 0 : '6em',
          }}
          onClick={handleClick(rKey)}
        >
          <ImgIcon src={rarityDefIcon(rKey)} size={1.5} sideMargin />
          {!xs && <Badge size="sm">{totals[rKey]}</Badge>}
        </SolidColoredToggleButton>
      ))}
    </Group>
  )
}
