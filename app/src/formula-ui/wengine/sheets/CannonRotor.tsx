import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { CannonRotor } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CannonRotor'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const formula = CannonRotor.formulas
const buff = CannonRotor.buffs

const sheet: UISheetElement = {
  title: chg('phase'),
  img: icon,
  documents: [
    {
      type: 'text',
      text: (
        <PhaseWrapper wKey={key}>
          {(phase) => chg(`phaseDescs.${phase - 1}`)}
        </PhaseWrapper>
      ),
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('passive_atk_') },
      fields: [tagToTagField(buff.passive_atk_.tag)],
    },
    {
      type: 'fields',
      fields: [
        {
          title: 'Additional DMG',
          fieldRef: formula.damage.tag,
        },
      ],
    },
  ],
}

export default sheet
