import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { CandlelitScheme } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CandlelitScheme'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = CandlelitScheme.conditionals
const buff = CandlelitScheme.buffs

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
        label: ch('exSpecialUsedCond'),
        metadata: cond.exSpecialUsed,
        fields: [tagToTagField(buff.exSpecial_critRate_.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('hpBelow50Cond'),
        metadata: cond.hpBelow50,
        fields: [tagToTagField(buff.hpBelow50_dmg_.tag)],
      },
    },
  ],
}

export default sheet
