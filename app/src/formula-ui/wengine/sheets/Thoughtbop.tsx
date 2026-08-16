import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { Thoughtbop } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'Thoughtbop'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = Thoughtbop.conditionals
const buff = Thoughtbop.buffs

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
          tagToTagField(buff.team_common_dmg_.tag),
          tagToTagField(buff.team_atk_.tag),
        ],
      },
    },
  ],
}

export default sheet
