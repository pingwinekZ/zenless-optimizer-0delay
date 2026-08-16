import { ColorText } from '@zenless-optimizer/common/ui'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { useContext } from 'react'
import { discDefIcon } from '../../../assets'
import {
  type CharacterKey,
  type DiscSetKey,
  elementalData,
} from '../../../consts'
import { FreedomBlues } from '../../../formula'
import { allStats } from '../../../stats'
import { trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'FreedomBlues'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = FreedomBlues.conditionals
const buff = FreedomBlues.buffs

// Component that dynamically shows the correct attribute name and color
// based on which character equips this disc set (from TagContext.src)
function AnomBuildupResLabel() {
  const tag = useContext(TagContext)
  const src = tag?.src as CharacterKey | undefined
  const attr = src ? allStats.char[src]?.attribute : undefined
  if (attr && attr in elementalData) {
    return (
      <ColorText color={attr}>
        {elementalData[attr]} Anomaly Buildup RES
      </ColorText>
    )
  }
  return <>Anomaly Buildup RES</>
}

const sheet: UISheet<'2' | '4'> = {
  2: {
    title: <Set2Display />,
    img: icon,
    documents: [
      {
        type: 'text',
        text: chg('desc2'),
      },
    ],
  },
  4: {
    title: <Set4Display />,
    img: icon,
    documents: [
      {
        type: 'text',
        text: chg('desc4'),
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_cond'),
          metadata: cond.exSpecialHit,
          fields: [
            {
              title: <AnomBuildupResLabel />,
              fieldRef: buff.anomBuildupRes_.tag,
            },
          ],
        },
      },
    ],
  },
}
export default sheet
