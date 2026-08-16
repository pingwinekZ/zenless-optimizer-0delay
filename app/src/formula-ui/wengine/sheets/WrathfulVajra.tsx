import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { WrathfulVajra } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'WrathfulVajra'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = WrathfulVajra.conditionals
const buff = WrathfulVajra.buffs

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
      fields: [tagToTagField(buff.passive_crit_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialAssistLaunchedCond'),
        metadata: cond.exSpecialAssistLaunched,
        fields: [tagToTagField(buff.cond_fire_sheer_dmg_.tag)],
      },
    },
  ],
}

export default sheet
