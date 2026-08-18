import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { DawnsBloom } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'DawnsBloom'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = DawnsBloom.conditionals
const buff = DawnsBloom.buffs

const sheet: UISheet<'2' | '4'> = {
  2: {
    title: <Set2Display />,
    img: icon,
    documents: [
      {
        type: 'text',
        text: chg('desc2'),
      },
      {
        type: 'fields',
        fields: [tagToTagField(buff.set2_basic_dmg_.tag)],
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
        type: 'fields',
        fields: [tagToTagField(buff.set4_basic_dmg_.tag)],
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_cond'),
          metadata: cond.exSpecial_ult_used,
          fields: [tagToTagField(buff.set4_total_basic_dmg_.tag)],
        },
      },
    ],
  },
}
export default sheet
