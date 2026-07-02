import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { HalfSugarBunny } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'HalfSugarBunny'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = HalfSugarBunny.conditionals
const buff = HalfSugarBunny.buffs

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
      fields: [
        { title: 'ER buff', fieldRef: buff.passive_enerRegen.tag },
        { title: 'Squad ATK%', fieldRef: buff.passive_atk_.tag },
        { title: 'Squad HP%', fieldRef: buff.passive_hp_.tag },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('activateExtendEtherVeil'),
        metadata: cond.activateExtendEtherVeil,
        fields: [tagToTagField(buff.cond_crit_dmg_.tag)],
      },
    },
  ],
}

export default sheet
