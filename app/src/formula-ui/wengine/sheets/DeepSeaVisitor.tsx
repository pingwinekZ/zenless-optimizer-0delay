import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { DeepSeaVisitor } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'DeepSeaVisitor'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = DeepSeaVisitor.conditionals
const buff = DeepSeaVisitor.buffs

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
      header: { icon: null, text: ch('passive_ice_dmg_') },
      fields: [tagToTagField(buff.passive_ice_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('basicHitCond'),
        metadata: cond.basicHit,
        fields: [tagToTagField(buff.crit_.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('iceDashHitCond'),
        metadata: cond.iceDashAtkHit,
        fields: [tagToTagField(buff.extra_crit_.tag)],
      },
    },
  ],
}

export default sheet
