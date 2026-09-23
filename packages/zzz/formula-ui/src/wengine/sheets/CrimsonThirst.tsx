import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { CrimsonThirst } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CrimsonThirst'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = CrimsonThirst.conditionals
const buff = CrimsonThirst.buffs

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
        tagToTagField(buff.passive_crit_.tag),
        tagToTagField(buff.passive_electric_dmg_.tag),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exOrMaimCond'),
        metadata: cond.exOrMaim,
        fields: [tagToTagField(buff.cond_electric_sharp_dmg_.tag)],
      },
    },
  ],
}

export default sheet
