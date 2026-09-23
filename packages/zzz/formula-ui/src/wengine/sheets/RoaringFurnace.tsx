import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { RoaringFurnace } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'RoaringFurnace'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = RoaringFurnace.conditionals
const buff = RoaringFurnace.buffs

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
        tagToTagField(buff.exSpecial_dazeInc_.tag),
        tagToTagField(buff.chain_dazeInc_.tag),
        tagToTagField(buff.ult_dazeInc_.tag),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        metadata: cond.chainOrUlt,
        label: ch('chainOrUltCond'),
        fields: [tagToTagField(buff.team_chainOrUlt_dmg_.tag)],
      },
    },
  ],
}

export default sheet
