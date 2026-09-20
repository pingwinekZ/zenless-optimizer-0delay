import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { BunnyBand } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BunnyBand'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = BunnyBand.conditionals
const buff = BunnyBand.buffs

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
      header: { icon: null, text: ch('passive_hp_') },
      fields: [tagToTagField(buff.passive_hp_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('shieldedCond'),
        metadata: cond.wearerShielded,
        fields: [tagToTagField(buff.atk_.tag)],
      },
    },
  ],
}

export default sheet
