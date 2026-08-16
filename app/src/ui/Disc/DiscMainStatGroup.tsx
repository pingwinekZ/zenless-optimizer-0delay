import { Button } from '@mantine/core'
import type { DropdownButtonProps } from '@zenless-optimizer/common/ui'
import { BootstrapTooltip, CardThemed } from '@zenless-optimizer/common/ui'
import type { ReactNode } from 'react'
import type { DiscMainStatKey, DiscSlotKey } from '../../consts'
import { discSlotToMainStatKeys, statKeyTextMap } from '../../consts'
import { StatIcon } from '../../svgicons'
import { StatDisplay } from '../Character'

export function DiscMainStatGroup({
  statKey,
  slotKey,
  setStatKey,
}: {
  statKey?: DiscMainStatKey
  slotKey?: DiscSlotKey
  setStatKey: (statKey: DiscMainStatKey) => void
  defText?: ReactNode
  dropdownButtonProps?: Omit<DropdownButtonProps, 'children' | 'title'>
}) {
  if (!slotKey) return null
  if (statKey && ['1', '2', '3'].includes(slotKey))
    return (
      <CardThemed p={8} bgt="light">
        <StatDisplay statKey={discSlotToMainStatKeys[slotKey][0]} showPercent />
      </CardThemed>
    )
  return (
    <Button.Group>
      {slotKey &&
        discSlotToMainStatKeys[slotKey].map((stat) => (
          <BootstrapTooltip key={stat} label={statKeyTextMap[stat]}>
            <Button
              color={statKey === stat ? 'green' : undefined}
              onClick={() => setStatKey(stat)}
              variant={statKey === stat ? 'filled' : 'default'}
              p={0}
            >
              <StatIcon statKey={stat} />
            </Button>
          </BootstrapTooltip>
        ))}
    </Button.Group>
  )
}
