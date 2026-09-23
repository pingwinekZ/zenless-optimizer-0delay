import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { HalfSugarBunny } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'HalfSugarBunny'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = HalfSugarBunny.conditionals
const buff = HalfSugarBunny.buffs

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
      header: { icon: null, text: ch('passive_enerRegen') },
      fields: [tagToTagField(buff.passive_enerRegen.tag)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('passive_squad_header') },
      fields: [
        tagToTagField(buff.passive_atk_.tag),
        tagToTagField(buff.passive_hp_.tag),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('activateExtendEtherVeilCond'),
        metadata: cond.activateExtendEtherVeil,
        fields: [tagToTagField(buff.cond_crit_dmg_.tag)],
      },
    },
  ],
}

export default sheet
