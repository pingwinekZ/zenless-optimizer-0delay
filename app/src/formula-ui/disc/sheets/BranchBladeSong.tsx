import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { BranchBladeSong } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'BranchBladeSong'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = BranchBladeSong.conditionals
const buff = BranchBladeSong.buffs

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
        type: 'fields',
        fields: [tagToTagField(buff.set4_passive.tag)],
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_cond'),
          metadata: cond.apply_or_trigger,
          fields: [tagToTagField(buff.set4_cond.tag)],
        },
      },
    ],
  },
}
export default sheet
