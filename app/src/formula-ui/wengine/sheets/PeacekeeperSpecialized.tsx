import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { PeacekeeperSpecialized } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PeacekeeperSpecialized'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const buff = PeacekeeperSpecialized.buffs

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
      header: { icon: null, text: ch('ab') },
      fields: [
        tagToTagField(buff.passive_exSpecial_anomBuildup_.tag),
        tagToTagField(buff.passive_assist_anomBuildup_.tag),
      ],
    },
  ],
}

export default sheet
