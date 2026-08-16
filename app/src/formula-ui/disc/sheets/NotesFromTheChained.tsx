import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { NotesFromTheChained } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'NotesFromTheChained'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = NotesFromTheChained.conditionals
const buff = NotesFromTheChained.buffs

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
          label: ch('condAbloom'),
          metadata: cond.abloom,
          fields: [tagToTagField(buff.set4_abloom_anomProf.tag)],
        },
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('condFreeze'),
          metadata: cond.freeze_shatter,
          fields: [
            tagToTagField(buff.set4_freeze_anomDmg.tag),
            tagToTagField(buff.set4_freeze_disorderDmg.tag),
          ],
        },
      },
    ],
  },
}
export default sheet
