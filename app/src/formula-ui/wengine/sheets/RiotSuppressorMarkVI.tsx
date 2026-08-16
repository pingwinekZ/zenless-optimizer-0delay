import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { RiotSuppressorMarkVI } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'RiotSuppressorMarkVI'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = RiotSuppressorMarkVI.conditionals
const buff = RiotSuppressorMarkVI.buffs

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
      fields: [tagToTagField(buff.passive_crit_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('cond'),
        metadata: cond.charge,
        fields: [tagToTagField(buff.basic_ether_dmg_.tag)],
      },
    },
  ],
}

export default sheet
