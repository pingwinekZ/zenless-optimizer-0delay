import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { FlightOfFancy } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'FlightOfFancy'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = FlightOfFancy.conditionals
const buff = FlightOfFancy.buffs

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
        label: ch('etherDmgCond'),
        metadata: cond.etherDmg,
        fields: [
          tagToTagField(buff.etherDmg_anomProf.tag),
          {
            title: 'Duration', // TODO: L10n,
            fieldValue: dm.duration,
          },
          {
            title: 'Cooldown', // TODO: L10n,
            fieldValue: dm.cd,
          },
        ],
      },
    },
  ],
}

export default sheet
