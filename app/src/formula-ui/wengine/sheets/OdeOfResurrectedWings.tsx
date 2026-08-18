import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { OdeOfResurrectedWings } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'OdeOfResurrectedWings'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = OdeOfResurrectedWings.conditionals
const buff = OdeOfResurrectedWings.buffs

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
      fields: [tagToTagField(buff.anomProf.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('refringeCond'),
        metadata: cond.refringe_triggered,
        fields: [
          tagToTagField(buff.anomDmg_.tag),
          tagToTagField(buff.teamDmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
