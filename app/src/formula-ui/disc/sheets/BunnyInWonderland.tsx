import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { BunnyInWonderland } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'BunnyInWonderland'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = BunnyInWonderland.conditionals
const buff = BunnyInWonderland.buffs

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
          label: ch('cond'),
          metadata: cond.stacks,
          fields: [tagToTagField(buff.set4_dmg_.tag)],
        },
      },
    ],
  },
}
export default sheet
