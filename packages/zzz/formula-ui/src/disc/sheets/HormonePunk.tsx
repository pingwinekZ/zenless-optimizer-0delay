import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '@zenless-optimizer/zzz/assets'
import type { DiscSetKey } from '@zenless-optimizer/zzz/consts'
import { HormonePunk } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'HormonePunk'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = HormonePunk.conditionals
const buff = HormonePunk.buffs

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
          metadata: cond.entering_combat,
          fields: [tagToTagField(buff.set4_cond_entering_combat.tag)],
        },
      },
    ],
  },
}
export default sheet
