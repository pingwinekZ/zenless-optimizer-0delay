import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { LunarPleniluna } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'LunarPleniluna'
const [chg, ch] = trans('wengine', key)
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
      header: { icon: null, text: ch('passive_header') },
      fields: [
        tagToTagField(buff.basic_dmg_.tag),
        tagToTagField(buff.dash_dmg_.tag),
        tagToTagField(buff.dodgeCounter_dmg_.tag),
      ],
    },
  ],
}

export default sheet
