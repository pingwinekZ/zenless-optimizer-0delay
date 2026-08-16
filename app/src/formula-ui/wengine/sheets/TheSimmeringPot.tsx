import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { TheSimmeringPot } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'TheSimmeringPot'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = TheSimmeringPot.conditionals
const buff = TheSimmeringPot.buffs

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
        label: ch('assistFollowUpCond'),
        metadata: cond.assistFollowUp,
        fields: [
          tagToTagField(buff.assistFollowUp_daze_.tag),
          tagToTagField(buff.assistFollowUp_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
