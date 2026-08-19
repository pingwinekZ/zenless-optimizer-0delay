import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ZanshinHerbCase } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ZanshinHerbCase'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = ZanshinHerbCase.conditionals
const buff = ZanshinHerbCase.buffs

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
      type: 'fields',
      header: { icon: null, text: ch('passive_electric_dmg_') },
      fields: [tagToTagField(buff.passive_electric_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('anomalyOrStunCond'),
        metadata: cond.apply_anom_stun,
        fields: [tagToTagField(buff.cond_crit_.tag)],
      },
    },
  ],
}

export default sheet
