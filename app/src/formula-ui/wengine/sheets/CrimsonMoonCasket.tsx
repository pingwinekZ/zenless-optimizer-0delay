import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { CrimsonMoonCasket } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CrimsonMoonCasket'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = CrimsonMoonCasket.conditionals
const buff = CrimsonMoonCasket.buffs

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
      header: { icon: null, text: ch('passive_crit_header') },
      fields: [tagToTagField(buff.passive_crit_.tag)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('passive_windResIgn_header') },
      fields: [tagToTagField(buff.passive_windResIgn_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialWindHitCond'),
        metadata: cond.exSpecialWindHit,
        fields: [
          tagToTagField(buff.cond_dazeInc_.tag),
          tagToTagField(buff.cond_teamDmg_.tag),
        ],
      },
    },
  ],
}

export default sheet
