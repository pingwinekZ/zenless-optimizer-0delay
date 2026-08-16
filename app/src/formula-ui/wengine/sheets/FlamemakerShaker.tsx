import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { FlamemakerShaker } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'FlamemakerShaker'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = FlamemakerShaker.conditionals
const buff = FlamemakerShaker.buffs

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
      type: 'conditional',
      conditional: {
        label: ch('cond1'),
        metadata: cond.offField,
        fields: [tagToTagField(buff.enerRegen.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('cond2'),
        metadata: cond.exSpecialAssistHits,
        fields: [
          tagToTagField(buff.common_dmg_.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.duration,
          },
          {
            title: 'Cooldown', // TODO: L10n,
            fieldValue: dm.cooldown,
          },
          tagToTagField(buff.anomProf.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.anomProfDuration,
          },
        ],
      },
    },
  ],
}

export default sheet
