import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { Metanukimorphosis } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'Metanukimorphosis'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = Metanukimorphosis.conditionals
const buff = Metanukimorphosis.buffs

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
        metadata: cond.physical_exSpecial_ult,
        label: ch('physical_exSpecial_ult_cond'),
        fields: [tagToTagField(buff.physical_exSpecial_ult_anomMas.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        metadata: cond.aftershock,
        label: ch('aftershockCond'),
        fields: [tagToTagField(buff.aftershock_team_anomProf.tag)],
      },
    },
  ],
}

export default sheet
