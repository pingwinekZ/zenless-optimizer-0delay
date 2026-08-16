import { Badge, Button, Group } from '@mantine/core'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import type { DiscSlotKey } from '../../consts'
import { allDiscSlotKeys } from '../../consts'

type DiscSlotToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: DiscSlotKey[]) => void
  value: DiscSlotKey[]
  totals: Record<DiscSlotKey, ReactNode>
}

const slotHandler = handleMultiSelect([...allDiscSlotKeys])

export function DiscSlotToggle({
  value,
  totals,
  onChange,
  ...props
}: DiscSlotToggleProps) {
  return (
    <Group {...(props as any)} gap="xs">
      {allDiscSlotKeys.map((slotKey) => (
        <Button
          key={slotKey}
          variant={value.includes(slotKey) ? 'filled' : 'outline'}
          size="compact-sm"
          onClick={() => onChange(slotHandler(value, slotKey))}
        >
          {slotKey}
          <Badge size="sm" ml={4}>
            {totals[slotKey]}
          </Badge>
        </Button>
      ))}
    </Group>
  )
}
