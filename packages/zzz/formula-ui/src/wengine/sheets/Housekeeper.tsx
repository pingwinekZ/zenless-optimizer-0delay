import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { Housekeeper } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'Housekeeper'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = Housekeeper.conditionals
const buff = Housekeeper.buffs

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
        label: ch('exSpecialHitCond'),
        metadata: cond.exSpecialHits,
        fields: [tagToTagField(buff.physical_dmg_.tag)],
      },
    },
  ],
}

export default sheet
