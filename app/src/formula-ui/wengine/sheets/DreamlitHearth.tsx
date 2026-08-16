import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { DreamlitHearth } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'DreamlitHearth'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = DreamlitHearth.conditionals
const buff = DreamlitHearth.buffs

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
      fields: [tagToTagField(buff.enerRegen.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherVeilActiveCond'),
        metadata: cond.etherVeilActive,
        fields: [
          tagToTagField(buff.common_dmg_.tag),
          tagToTagField(buff.hp_.tag),
        ],
      },
    },
  ],
}

export default sheet
