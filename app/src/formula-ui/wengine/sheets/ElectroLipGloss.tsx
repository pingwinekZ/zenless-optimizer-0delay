import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ElectroLipGloss } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ElectroLipGloss'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = ElectroLipGloss.conditionals
const buff = ElectroLipGloss.buffs

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
        metadata: cond.anomalyOnEnemy,
        fields: [
          tagToTagField(buff.atk_.tag),
          tagToTagField(buff.common_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
