import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { StarlightRiderFaceplate } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'StarlightRiderFaceplate'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = StarlightRiderFaceplate.conditionals
const buff = StarlightRiderFaceplate.buffs

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
      header: { icon: null, text: ch('passive_crit_') },
      fields: [tagToTagField(buff.passive_crit_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('specialUsedCond'),
        metadata: cond.specialUsed,
        fields: [tagToTagField(buff.cond_physical_sheer_dmg_.tag)],
      },
    },
  ],
}

export default sheet
