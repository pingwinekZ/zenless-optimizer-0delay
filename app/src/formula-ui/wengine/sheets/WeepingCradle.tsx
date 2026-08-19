import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { WeepingCradle } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'WeepingCradle'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = WeepingCradle.conditionals
const buff = WeepingCradle.buffs

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
      type: 'conditional',
      conditional: {
        label: ch('stacksCond'),
        metadata: cond.stacks,
        fields: [tagToTagField(buff.cond_dmg_.tag)],
      },
    },
  ],
}

export default sheet
