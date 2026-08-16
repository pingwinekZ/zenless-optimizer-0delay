import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { RadiowaveJourney } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'RadiowaveJourney'
const [chg] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = RadiowaveJourney.conditionals
const buff = RadiowaveJourney.buffs

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
        metadata: cond.launchingChainOrUlt,
        label: st('uponLaunch.2', {
          val1: '$t(skills.chain)',
          val2: '$t(skills.ult)',
        }),
        fields: [
          tagToTagField(buff.launchingChainOrUlt_sheerForce.tag),
          {
            title: st('duration'),
            fieldValue: dm.duration,
          },
        ],
      },
    },
  ],
}

export default sheet
