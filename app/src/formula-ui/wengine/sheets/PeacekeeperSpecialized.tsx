import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { PeacekeeperSpecialized } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PeacekeeperSpecialized'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = PeacekeeperSpecialized.conditionals
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
      type: 'conditional',
      conditional: {
        label: ch('cond'),
        metadata: cond.shielded,
        fields: [tagToTagField(buff.enerRegen.tag)],
      },
    },
    {
      type: 'fields',
      fields: [
        tagToTagField(buff.passive_exSpecial_anomBuildup_.tag),
        tagToTagField(buff.passive_assist_anomBuildup_.tag),
      ],
    },
  ],
}

export default sheet
