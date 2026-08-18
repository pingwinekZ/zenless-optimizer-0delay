import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { BashfulDemon } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BashfulDemon'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = BashfulDemon.conditionals
const buff = BashfulDemon.buffs

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
      header: { icon: null, text: ch('passive_ice_dmg_') },
      fields: [tagToTagField(buff.passive_ice_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialLaunchCond'),
        metadata: cond.launch_ex_attack,
        fields: [tagToTagField(buff.team_atk_.tag)],
      },
    },
  ],
}

export default sheet
