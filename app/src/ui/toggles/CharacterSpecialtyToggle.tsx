import { Badge, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { ImgIcon, SolidColoredToggleButton } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import { specialityDefIcon } from '../../assets'
import type { SpecialityKey } from '../../consts'
import { allSpecialityKeys } from '../../consts'

type CharSpecialtyToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: SpecialityKey[]) => void
  value: SpecialityKey[]
  totals: Record<SpecialityKey, ReactNode>
}

const specaltyTypeHandler = handleMultiSelect([...allSpecialityKeys])
export function CharSpecialtyToggle({
  value,
  totals,
  onChange,
  ...props
}: CharSpecialtyToggleProps) {
  const xs = !useMediaQuery('(min-width: 600px)')
  return (
    <Group {...(props as any)} gap="xs">
      {allSpecialityKeys.map((sk) => (
        <SolidColoredToggleButton
          key={sk}
          value={sk}
          selected={value.includes(sk)}
          style={{
            padding: xs ? 4 : undefined,
            minWidth: xs ? 0 : '6em',
          }}
          onClick={() => onChange(specaltyTypeHandler(value, sk))}
        >
          <ImgIcon src={specialityDefIcon(sk)} size={2} sideMargin />
          <Badge size="sm">{totals[sk]}</Badge>
        </SolidColoredToggleButton>
      ))}
    </Group>
  )
}
