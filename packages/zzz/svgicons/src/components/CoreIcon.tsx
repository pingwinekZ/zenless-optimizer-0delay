import type { SvgIconProps } from '@zenless-optimizer/common/svgicons'
import type { CoreKey } from '../../consts'
import {
  ACoreIcon,
  BCoreIcon,
  CCoreIcon,
  DCoreIcon,
  ECoreIcon,
  FCoreIcon,
} from '../icons'

export function CoreIcon({
  slotKey,
  iconProps = {},
}: {
  slotKey: CoreKey
  iconProps?: SvgIconProps
}) {
  switch (slotKey) {
    case 'A':
      return <ACoreIcon {...iconProps} />
    case 'B':
      return <BCoreIcon {...iconProps} />
    case 'C':
      return <CCoreIcon {...iconProps} />
    case 'D':
      return <DCoreIcon {...iconProps} />
    case 'E':
      return <ECoreIcon {...iconProps} />
    case 'F':
      return <FCoreIcon {...iconProps} />
  }
}
