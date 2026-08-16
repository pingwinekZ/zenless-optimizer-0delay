import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { CinderCobalt } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'CinderCobalt'
const [chg] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = CinderCobalt.conditionals
const buff = CinderCobalt.buffs

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
        label: st('enterCombatOrSwitchIn'),
        metadata: cond.enteringCombatOrSwitchingIn,
        fields: [
          tagToTagField(buff.enteringCombatOrSwitchingIn_atk_.tag),
          {
            title: st('duration'),
            fieldValue: dm.duration,
          },
          {
            title: st('cd'),
            fieldValue: dm.cd,
          },
        ],
      },
    },
  ],
}

export default sheet
