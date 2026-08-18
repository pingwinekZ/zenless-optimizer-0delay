import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { BigCylinder } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BigCylinder'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = BigCylinder.conditionals
const buff = BigCylinder.buffs
const formula = BigCylinder.formulas

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
      header: { icon: null, text: ch('passive_dmg_red_') },
      fields: [tagToTagField(buff.passive_dmg_red_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('afterAttackedCond'),
        metadata: cond.afterAttacked,
        fields: [tagToTagField(buff.cond_crit_.tag)],
      },
    },
    {
      type: 'fields',
      fields: [
        {
          title: 'Additional DMG',
          fieldRef: formula.damage.tag,
        },
      ],
    },
  ],
}

export default sheet
