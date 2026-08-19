import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { KnightsExtolment } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'KnightsExtolment'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = KnightsExtolment.conditionals
const buff = KnightsExtolment.buffs

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
        label: ch('battleEdgeCond'),
        metadata: cond.battle_edge_stacks,
        fields: [
          tagToTagField(buff.critDmg_.tag),
          tagToTagField(buff.iceResIgn_.tag),
        ],
      },
    },
  ],
}

export default sheet
