import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { PreciousFossilizedCore } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PreciousFossilizedCore'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = PreciousFossilizedCore.conditionals
const buff = PreciousFossilizedCore.buffs

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
        label: ch('enemyHpGECond'),
        metadata: cond.enemyHpGE,
        fields: [tagToTagField(buff.daze_.tag)],
      },
    },
  ],
}

export default sheet
