import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { LunarSemiluna } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'LunarSemiluna'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = LunarSemiluna.conditionals
const buff = LunarSemiluna.buffs

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
        label: ch('exSpecialUsedCond'),
        metadata: cond.exSpecialUsed,
        fields: [tagToTagField(buff.cond_basic_dmg_.tag)],
      },
    },
  ],
}

export default sheet
