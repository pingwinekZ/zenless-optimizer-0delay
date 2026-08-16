import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { WutheringSalon } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'WutheringSalon'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = WutheringSalon.conditionals
const buff = WutheringSalon.buffs

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
          label: ch('set4_windswept_cond'),
          metadata: cond.windswept_active,
          fields: [tagToTagField(buff.set4_windswept_dmg_.tag)],
        },
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_anom_prof_cond'),
          metadata: cond.ex_anom_prof_stacks,
          fields: [tagToTagField(buff.set4_anom_prof.tag)],
        },
      },
    ],
  },
}
export default sheet
