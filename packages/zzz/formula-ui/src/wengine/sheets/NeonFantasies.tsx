import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { NeonFantasies } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'NeonFantasies'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = NeonFantasies.conditionals
const buff = NeonFantasies.buffs

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
      header: { icon: null, text: ch('anomProf') },
      fields: [tagToTagField(buff.anomalyProf.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('stacksCond'),
        metadata: cond.stacks,
        fields: [
          tagToTagField(buff.squadDmg_.tag),
          tagToTagField(buff.maxStacks_anomalyProf.tag),
        ],
      },
    },
  ],
}

export default sheet
