import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { MarcatoDesire } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'MarcatoDesire'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = MarcatoDesire.conditionals
const buff = MarcatoDesire.buffs

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
        fields: [tagToTagField(buff.atk_.tag)],
      },
    },
  ],
}

export default sheet
