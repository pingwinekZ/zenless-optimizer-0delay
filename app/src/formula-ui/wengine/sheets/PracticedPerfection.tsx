import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { PracticedPerfection } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PracticedPerfection'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = PracticedPerfection.conditionals
const buff = PracticedPerfection.buffs

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
      header: { icon: null, text: ch('anomMas') },
      fields: [tagToTagField(buff.anomMas.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        metadata: cond.stacks,
        label: ch('stacksCond'),
        fields: [tagToTagField(buff.stacks_phys_dmg_.tag)],
      },
    },
  ],
}

export default sheet
