import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { JoyauDore } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'JoyauDore'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = JoyauDore.conditionals
const buff = JoyauDore.buffs

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
        {
          title: 'AP buff',
          fieldRef: buff.anomProf.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('cond'),
        metadata: cond.wind_ex_stacks,
        fields: [
          tagToTagField(buff.vortexDmg_.tag),
          tagToTagField(buff.windsweptDmg_.tag),
          {
            title: 'Squad AP',
            fieldRef: buff.squadAnomProf.tag,
          },
          {
            title: 'Duration',
            fieldValue: dm.duration,
          },
        ],
      },
    },
  ],
}

export default sheet
