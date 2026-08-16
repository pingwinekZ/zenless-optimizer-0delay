import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { KrakensCradle } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'KrakensCradle'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = KrakensCradle.conditionals
const buff = KrakensCradle.buffs

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
        label: ch('hpDecreasedCond'),
        metadata: cond.hpDecreased,
        fields: [tagToTagField(buff.ice_sheer_dmg_.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('hpBelow50Cond'),
        metadata: cond.hpBelow50,
        fields: [tagToTagField(buff.crit_.tag)],
      },
    },
  ],
}

export default sheet
