import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { HeartstringNocturne } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'HeartstringNocturne'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = HeartstringNocturne.conditionals
const buff = HeartstringNocturne.buffs

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
        label: ch('heartstringCond'),
        metadata: cond.heartstring,
        fields: [
          tagToTagField(buff.chain_resIgn_fire_.tag),
          tagToTagField(buff.ult_resIgn_fire_.tag),
        ],
      },
    },
  ],
}

export default sheet
