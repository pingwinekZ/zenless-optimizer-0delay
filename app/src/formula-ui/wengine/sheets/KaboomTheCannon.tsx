import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { KaboomTheCannon } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'KaboomTheCannon'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = KaboomTheCannon.conditionals
const buff = KaboomTheCannon.buffs

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
        label: ch('allyHitCond'),
        metadata: cond.allyHitsEnemy,
        fields: [tagToTagField(buff.atk_.tag)],
      },
    },
  ],
}

export default sheet
