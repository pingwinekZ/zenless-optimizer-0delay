import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { CordisGermina } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CordisGermina'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = CordisGermina.conditionals
const buff = CordisGermina.buffs

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
        label: ch('stacksCond'),
        metadata: cond.basic_exSpecial_used,
        fields: [
          tagToTagField(buff.cond_electric_dmg_.tag),
          tagToTagField(buff.cond_basic_defIgn_.tag),
          tagToTagField(buff.cond_ult_defIgn_.tag),
        ],
      },
    },
  ],
}

export default sheet
