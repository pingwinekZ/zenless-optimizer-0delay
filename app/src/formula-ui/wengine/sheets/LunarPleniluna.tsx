import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { LunarPleniluna } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'LunarPleniluna'
const [chg, _ch] = trans('wengine', key)
const icon = wengineAsset(key)
const buff = LunarPleniluna.buffs

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
        tagToTagField(buff.basic_dmg_.tag),
        tagToTagField(buff.dash_dmg_.tag),
        tagToTagField(buff.dodgeCounter_dmg_.tag),
      ],
    },
  ],
}

export default sheet
