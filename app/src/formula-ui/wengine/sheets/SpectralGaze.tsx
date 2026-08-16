import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { SpectralGaze } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'SpectralGaze'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = SpectralGaze.conditionals
const buff = SpectralGaze.buffs

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
        metadata: cond.hit_aftershock_electric,
        fields: [
          tagToTagField(buff.cond_defRed_.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.duration1,
          },
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('cond2'),
        metadata: cond.spiritLock,
        fields: [
          tagToTagField(buff.cond_impact_.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.duration2,
          },
        ],
      },
    },
  ],
}

export default sheet
