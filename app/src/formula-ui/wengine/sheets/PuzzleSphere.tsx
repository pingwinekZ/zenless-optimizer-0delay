import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { PuzzleSphere } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PuzzleSphere'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = PuzzleSphere.conditionals
const buff = PuzzleSphere.buffs

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
        fields: [
          tagToTagField(buff.launchingExSpecial_crit_dmg_.tag),
          tagToTagField(buff.targetHpBelow50_exSpecial_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
