import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { YunkuiTales } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'YunkuiTales'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = YunkuiTales.conditionals
const buff = YunkuiTales.buffs

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
        fields: [tagToTagField(buff.set2.tag)],
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
          metadata: cond.uponLaunchExSpecialChainOrUlt,
          label: ch('set4_cond'),
          fields: [
            tagToTagField(buff.set4_crit_.tag),
            tagToTagField(buff.set4_sheer_dmg_.tag),
          ],
        },
      },
    ],
  },
}
export default sheet
