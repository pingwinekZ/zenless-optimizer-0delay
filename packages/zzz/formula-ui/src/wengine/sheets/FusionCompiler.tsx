import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { FusionCompiler } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'FusionCompiler'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = FusionCompiler.conditionals
const buff = FusionCompiler.buffs

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
      type: 'fields',
      header: { icon: null, text: ch('passive_atk_') },
      fields: [tagToTagField(buff.passive_atk_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('specialUsedCond'),
        metadata: cond.specialUsed,
        fields: [tagToTagField(buff.anomProf.tag)],
      },
    },
  ],
}

export default sheet
