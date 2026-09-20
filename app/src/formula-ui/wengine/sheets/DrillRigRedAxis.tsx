import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { DrillRigRedAxis } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'DrillRigRedAxis'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = DrillRigRedAxis.conditionals
const buff = DrillRigRedAxis.buffs

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
        label: ch('exSpecialOrChainCond'),
        metadata: cond.exSpecialOrChainUsed,
        fields: [
          tagToTagField(buff.basic_eletric_dmg_.tag),
          tagToTagField(buff.dash_eletric_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
