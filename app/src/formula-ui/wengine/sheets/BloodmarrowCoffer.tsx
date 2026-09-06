import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { BloodmarrowCoffer } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BloodmarrowCoffer'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const buff = BloodmarrowCoffer.buffs

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
      fields: [tagToTagField(buff.cond_overCrit_dmg_.tag)],
    },
  ],
}

export default sheet
