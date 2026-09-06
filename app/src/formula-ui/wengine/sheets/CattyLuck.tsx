import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { CattyLuck } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CattyLuck'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = CattyLuck.conditionals
const buff = CattyLuck.buffs

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
      header: { icon: null, text: ch('passive_header') },
      fields: [tagToTagField(buff.passive_def_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialUsedCond'),
        metadata: cond.exSpecialUsed,
        fields: [tagToTagField(buff.cond_ex_def_.tag)],
      },
    },
  ],
}

export default sheet
