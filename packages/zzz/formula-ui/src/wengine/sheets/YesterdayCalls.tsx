import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { YesterdayCalls } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'YesterdayCalls'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = YesterdayCalls.conditionals
const buff = YesterdayCalls.buffs

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
        label: ch('physExSpecialStacksCond'),
        metadata: cond.physExSpecialUsed,
        fields: [
          tagToTagField(buff.cond_dazeInc_.tag),
          tagToTagField(buff.cond_crit_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
