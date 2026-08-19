import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { DemaraBatteryMarkII } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'DemaraBatteryMarkII'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const buff = DemaraBatteryMarkII.buffs

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
      header: { icon: null, text: ch('passive_electric_dmg_') },
      fields: [tagToTagField(buff.passive_electric_dmg_.tag)],
    },
  ],
}

export default sheet
