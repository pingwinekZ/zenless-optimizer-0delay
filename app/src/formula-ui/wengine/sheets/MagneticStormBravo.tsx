import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { MagneticStormBravo } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'MagneticStormBravo'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = MagneticStormBravo.conditionals
const buff = MagneticStormBravo.buffs

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
        label: ch('cond'),
        metadata: cond.anomalyBuildupIncreased,
        fields: [
          tagToTagField(buff.anomProf.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.duration,
          },
          {
            title: 'Cooldown', // TODO: L10n,
            fieldValue: dm.cooldown,
          },
        ],
      },
    },
  ],
}

export default sheet
