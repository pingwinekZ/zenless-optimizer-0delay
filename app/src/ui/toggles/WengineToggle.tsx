import { Badge, Button, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import { specialityDefIcon } from '../../assets'
import type { SpecialityKey } from '../../consts'
import { allSpecialityKeys } from '../../consts'

type WengineToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: SpecialityKey[]) => void
  value: SpecialityKey[]
  totals?: Record<SpecialityKey, ReactNode>
}

const wengineTypeHandler = handleMultiSelect([...allSpecialityKeys])
export function WengineToggle({
  value,
  totals,
  onChange,
  ...props
}: WengineToggleProps) {
  const xs = !useMediaQuery('(min-width: 600px)')
  return (
    <Group {...(props as any)} gap="xs">
      {allSpecialityKeys.map((sk) => (
        <Button
          key={sk}
          variant={value.includes(sk) ? 'filled' : 'outline'}
          style={{
            padding: xs ? 4 : undefined,
            minWidth: xs ? 0 : '6em',
          }}
          onClick={() => onChange(wengineTypeHandler(value, sk))}
        >
          <ImgIcon src={specialityDefIcon(sk)} size={2} sideMargin />
          {totals && <Badge size="sm">{totals[sk]}</Badge>}
        </Button>
      ))}
    </Group>
  )
}
