import {
  ColorText,
  ImgIcon,
  SqBadge,
  TranslateBase,
} from '@zenless-optimizer/common/ui'
import '../theme' // import to validate typing for color variants
import type { ReactNode } from 'react'
import { commonDefIcon } from '../assets'

const textComponents = {
  fire: <ColorText color="fire" />,
  ice: <ColorText color="ice" />,
  electric: <ColorText color="electric" />,
  frost: <ColorText color="frost" />,
  physical: <ColorText color="physical" />,
  ether: <ColorText color="ether" />,
  wind: <ColorText color="wind" />,
  ct: <ColorText />,
  IconNormal: <ImgIcon src={commonDefIcon('basicFlat')} size={1.5} />,
  IconEvade: <ImgIcon src={commonDefIcon('dodgeFlat')} size={1.5} />,
  IconSpecial: <ImgIcon src={commonDefIcon('specialFlat')} size={1.5} />,
  IconSpecialReady: (
    <ImgIcon src={commonDefIcon('specialReadyFlat')} size={1.5} />
  ),
  IconSpecialReadyRp: (
    <ImgIcon src={commonDefIcon('specialRpReadyFlat')} size={1.5} />
  ),
  IconUltimateReady: (
    <ImgIcon src={commonDefIcon('chainReadyFlat')} size={1.5} />
  ),
  IconSwitch: <ImgIcon src={commonDefIcon('assistFlat')} size={1.5} />,
}

const badgeComponents = {
  fire: <SqBadge color="fire" />,
  ice: <SqBadge color="ice" />,
  electric: <SqBadge color="electric" />,
  frost: <SqBadge color="frost" />,
  physical: <SqBadge color="physical" />,
  ether: <SqBadge color="ether" />,
  wind: <SqBadge color="wind" />,
  ct: <ColorText />,
}

export function Translate({
  ns,
  key18,
  values,
  children,
  useBadge,
}: {
  ns: string
  key18: string
  values?: Record<string, string | number>
  children?: ReactNode
  useBadge?: boolean
}) {
  return (
    <TranslateBase
      ns={ns}
      key18={key18}
      values={values}
      children={children}
      components={useBadge ? badgeComponents : textComponents}
    />
  )
}
