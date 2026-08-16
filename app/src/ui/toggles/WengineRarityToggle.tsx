import { Badge, Button, Group } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { SolidToggleButtonGroupProps } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import type { WengineRarityKey } from '../../consts'
import { allWengineRarityKeys } from '../../consts'

type WengineRarityToggleProps = Omit<
  SolidToggleButtonGroupProps,
  'onChange' | 'value'
> & {
  onChange: (value: WengineRarityKey[]) => void
  value: WengineRarityKey[]
  totals?: Record<WengineRarityKey, ReactNode>
}
const rarityHandler = handleMultiSelect([...allWengineRarityKeys])
export function WengineRarityToggle({
  value,
  totals,
  onChange,
  ...props
}: WengineRarityToggleProps) {
  const xs = !useMediaQuery('(min-width: 600px)')
  return (
    <Group {...(props as any)} gap="xs">
      {allWengineRarityKeys.map((wrk) => (
        <Button
          key={wrk}
          variant={value.includes(wrk) ? 'filled' : 'outline'}
          style={{
            padding: xs ? 4 : undefined,
            minWidth: xs ? 0 : '6em',
          }}
          onClick={() => onChange(rarityHandler(value, wrk))}
        >
          <strong>{wrk}</strong>
          {totals && (
            <Badge size="sm" ml={4}>
              {totals[wrk]}
            </Badge>
          )}
        </Button>
      ))}
    </Group>
  )
}
