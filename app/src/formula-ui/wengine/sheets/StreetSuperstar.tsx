import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { StreetSuperstar } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'StreetSuperstar'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = StreetSuperstar.conditionals
const buff = StreetSuperstar.buffs

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
      type: 'conditional',
      conditional: {
        label: ch('cond'),
        metadata: cond.charge,
        fields: [tagToTagField(buff.cond_ult_dmg_.tag)],
      },
    },
  ],
}

export default sheet
