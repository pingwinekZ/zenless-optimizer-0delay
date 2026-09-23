import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { SixShooter } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'SixShooter'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = SixShooter.conditionals
const buff = SixShooter.buffs

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
        label: ch('chargeCond'),
        metadata: cond.charge,
        fields: [tagToTagField(buff.exSpecial_daze_.tag)],
      },
    },
  ],
}

export default sheet
