import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { AngelInTheShell } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'AngelInTheShell'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = AngelInTheShell.conditionals
const buff = AngelInTheShell.buffs

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
      fields: [tagToTagField(buff.passive_anomProf.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherBuffActiveCond'),
        metadata: cond.onFieldOrSpecialUsed,
        fields: [
          tagToTagField(buff.cond_common_dmg_.tag),
          {
            title: ch('cond_anomaly_dmg_'),
            fieldRef: buff.cond_anomaly_dmg_.tag,
          },
          {
            title: ch('cond_disorder_dmg_'),
            fieldRef: buff.cond_disorder_dmg_.tag,
          },
        ],
      },
    },
  ],
}

export default sheet
