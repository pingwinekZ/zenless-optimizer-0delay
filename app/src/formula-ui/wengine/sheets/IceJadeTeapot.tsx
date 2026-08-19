import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { IceJadeTeapot } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'IceJadeTeapot'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = IceJadeTeapot.conditionals
const buff = IceJadeTeapot.buffs

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
        label: ch('tearifficCond'),
        metadata: cond.teariffic,
        fields: [
          tagToTagField(buff.impact_.tag),
          tagToTagField(buff.common_dmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
