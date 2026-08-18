import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { BlazingLaurel } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BlazingLaurel'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = BlazingLaurel.conditionals
const buff = BlazingLaurel.buffs

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
        label: ch('quickOrPerfectAssistCond'),
        metadata: cond.quickOrPerfectAssistUsed,
        fields: [tagToTagField(buff.impact_.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('wiltCond'),
        metadata: cond.wilt,
        fields: [
          tagToTagField(buff.crit_dmg_ice_.tag),
          tagToTagField(buff.crit_dmg_fire_.tag),
        ],
      },
    },
  ],
}

export default sheet
