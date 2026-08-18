import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ReverbMarkII } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ReverbMarkII'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = ReverbMarkII.conditionals
const buff = ReverbMarkII.buffs

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
          tagToTagField(buff.anomMas.tag),
          tagToTagField(buff.anomProf.tag),
        ],
      },
    },
  ],
}

export default sheet
