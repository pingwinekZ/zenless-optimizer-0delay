import { HoverCard, Text } from '@mantine/core'
import { IconHelpCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import classes from './TooltipImage.module.css'

export type HintContent = {
  title: string
  content: ReactNode
}

/**
 * Fribbels-style hint icon: a faint question mark with a wide hover card.
 * Ported from hsr-optimizer's TooltipImage.
 */
export function TooltipImage({ type }: { type: HintContent }) {
  return (
    <HoverCard width={500} openDelay={200} closeDelay={100}>
      <HoverCard.Target>
        <IconHelpCircle size={16} style={{ opacity: 0.6, cursor: 'pointer' }} />
      </HoverCard.Target>
      <HoverCard.Dropdown className={classes.dropdown}>
        <Text fw={600} mb={4}>
          {type.title}
        </Text>
        {type.content}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
