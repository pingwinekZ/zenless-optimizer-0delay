import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { WeepingGemini } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'WeepingGemini'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = WeepingGemini.conditionals
const buff = WeepingGemini.buffs

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
        metadata: cond.anomaly_stack,
        fields: [tagToTagField(buff.anomProf.tag)],
      },
    },
  ],
}

export default sheet
