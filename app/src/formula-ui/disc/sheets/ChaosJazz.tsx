import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { ChaosJazz } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { Set2Display, Set4Display } from '../components'

const key: DiscSetKey = 'ChaosJazz'
const [chg, ch] = trans('disc', key)
const icon = discDefIcon(key)
const cond = ChaosJazz.conditionals
const buff = ChaosJazz.buffs

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
          tagToTagField(buff.set4_passive_fire_dmg_.tag),
          tagToTagField(buff.set4_passive_electric_dmg_.tag),
        ],
      },
      {
        type: 'conditional',
        conditional: {
          label: ch('set4_cond'),
          metadata: cond.while_off_field,
          fields: [
            {
              title: 'EX Special Attack DMG', // TODO: L10n
              fieldRef: buff.set4_off_field_special_dmg_.tag,
            },
            {
              title: 'Assist Attack Attack DMG', // TODO: L10n
              fieldRef: buff.set4_off_field_assist_dmg_.tag,
            },
          ],
        },
      },
    ],
  },
}
export default sheet
