import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { YesterdayCalls } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'YesterdayCalls'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = YesterdayCalls.conditionals
const buff = YesterdayCalls.buffs

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
        label: ch('offFieldCond'),
        metadata: cond.offField,
        fields: [tagToTagField(buff.cond_enerRegen.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('physExSpecialStacksCond'),
        metadata: cond.physExSpecialUsed,
        fields: [
          tagToTagField(buff.cond_dazeInc_.tag),
          tagToTagField(buff.cond_crit_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
