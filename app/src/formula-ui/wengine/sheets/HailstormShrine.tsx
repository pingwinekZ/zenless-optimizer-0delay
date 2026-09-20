import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { HailstormShrine } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'HailstormShrine'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = HailstormShrine.conditionals
const buff = HailstormShrine.buffs

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
      header: { icon: null, text: ch('passive_crit_dmg_') },
      fields: [tagToTagField(buff.passive_crit_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialOrAnomalyCond'),
        metadata: cond.exSpecialOrAnomaly,
        fields: [tagToTagField(buff.ice_dmg_.tag)],
      },
    },
  ],
}

export default sheet
