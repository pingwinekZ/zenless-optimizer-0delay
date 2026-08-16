import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { FrostfallSickle } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'FrostfallSickle'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = FrostfallSickle.conditionals
const buff = FrostfallSickle.buffs

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
        label: ch('specialUsedCond'),
        metadata: cond.specialUsed,
        fields: [
          tagToTagField(buff.cond_ice_dmg_.tag),
          tagToTagField(buff.cond_abloom_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
