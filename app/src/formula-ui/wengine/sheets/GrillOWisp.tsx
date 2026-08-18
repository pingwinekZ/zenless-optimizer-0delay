import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { GrillOWisp } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'GrillOWisp'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = GrillOWisp.conditionals
const buff = GrillOWisp.buffs

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
      header: { icon: null, text: ch('fire_dmg_') },
      fields: [tagToTagField(buff.fire_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('hpDecreasedCond'),
        metadata: cond.hpDecreased,
        fields: [tagToTagField(buff.crit_.tag)],
      },
    },
  ],
}

export default sheet
