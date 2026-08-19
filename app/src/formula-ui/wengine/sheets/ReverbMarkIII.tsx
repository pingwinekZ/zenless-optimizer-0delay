import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ReverbMarkIII } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ReverbMarkIII'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = ReverbMarkIII.conditionals
const buff = ReverbMarkIII.buffs

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
        label: ch('chainOrUltUsedCond'),
        metadata: cond.chainOrUltUsed,
        fields: [tagToTagField(buff.atk_.tag)],
      },
    },
  ],
}

export default sheet
