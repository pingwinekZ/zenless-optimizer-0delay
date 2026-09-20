import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { TheBrimstone } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'TheBrimstone'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = TheBrimstone.conditionals
const buff = TheBrimstone.buffs

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
        label: ch('basicDashDodgeHitCond'),
        metadata: cond.hit_basic_dash_dodge,
        fields: [tagToTagField(buff.cond_atk_.tag)],
      },
    },
  ],
}

export default sheet
