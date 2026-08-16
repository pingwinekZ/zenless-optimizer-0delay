import { Badge, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { SolidColoredToggleButton } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import type { AttributeKey } from '../../consts'
import { allAttributeKeys } from '../../consts'
import { ElementIcon } from '../../svgicons'

type ElementToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: AttributeKey[]) => void
  value: AttributeKey[]
  totals: Record<AttributeKey, ReactNode>
}
const elementHandler = handleMultiSelect([...allAttributeKeys])
export function ElementToggle({
  value,
  totals,
  onChange,
  ...props
}: ElementToggleProps) {
  const sm = !useMediaQuery('(min-width: 900px)')
  const xs = !useMediaQuery('(min-width: 600px)')
  return (
    <Group {...(props as any)} gap="xs">
      {allAttributeKeys.map((atr) => (
        <SolidColoredToggleButton
          key={atr}
          value={atr}
          selected={value.includes(atr)}
          style={{
            padding: sm ? 4 : undefined,
            minWidth: sm ? 0 : '6em',
          }}
          onClick={() => onChange(elementHandler(value, atr))}
        >
          <ElementIcon
            ele={atr}
            iconProps={{ fontSize: sm && !xs ? 'inherit' : undefined }}
          />
          {!xs && (
            <Badge ml={2} size="sm">
              {totals[atr]}
            </Badge>
          )}
        </SolidColoredToggleButton>
      ))}
    </Group>
  )
}
