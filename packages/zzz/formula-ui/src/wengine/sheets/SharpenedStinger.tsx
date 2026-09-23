import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { SharpenedStinger } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'SharpenedStinger'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = SharpenedStinger.conditionals
const buff = SharpenedStinger.buffs

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
        label: ch('predatoryInstinctCond'),
        metadata: cond.predatoryInstinct,
        fields: [
          tagToTagField(buff.physical_dmg_.tag),
          tagToTagField(buff.anomBuildup_.tag),
        ],
      },
    },
  ],
}

export default sheet
