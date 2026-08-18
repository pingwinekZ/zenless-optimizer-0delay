import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { WhiteWaterBallad } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'WhiteWaterBallad'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = WhiteWaterBallad.conditionals
const buff = WhiteWaterBallad.buffs

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
          label: ch('set4_cond_inEtherVeil'),
          description: ch('set4_cond_inEtherVeil_desc'),
          metadata: cond.inEtherVeil,
          fields: [tagToTagField(buff.set4_inVeil_crit_.tag)],
        },
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_cond_activateExtendVeil'),
          description: ch('set4_cond_activateExtendVeil_desc'),
          metadata: cond.activateExtendVeil,
          fields: [
            tagToTagField(buff.set4_activate_crit_.tag),
            tagToTagField(buff.set4_atk_.tag),
          ],
        },
      },
    ],
  },
}
export default sheet
