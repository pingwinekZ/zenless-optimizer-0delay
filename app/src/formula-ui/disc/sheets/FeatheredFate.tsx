import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { FeatheredFate } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'FeatheredFate'
const [chg, _ch] = trans('disc', key)
const icon = discDefIcon(key)
const buff = FeatheredFate.buffs

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
        fields: [
          tagToTagField(buff.set4_anomProf.tag),
          tagToTagField(buff.set4_anom_dmg_.tag),
        ],
      },
    ],
  },
}
export default sheet
