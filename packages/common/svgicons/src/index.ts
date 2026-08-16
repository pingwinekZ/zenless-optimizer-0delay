import type { SVGProps } from 'react'

export * from './icons/AnvilIcon'
export * from './icons/DiscordIcon'
export * from './icons/FriendshipIcon'
export * from './icons/PatreonIcon'
export * from './icons/PaypalIcon'
export * from './icons/TwitchIcon'

export type SvgIconProps = SVGProps<SVGSVGElement>

export const iconInlineProps = {
  fontSize: 'inherit',
  style: { verticalAlign: '-10%' },
} as const
