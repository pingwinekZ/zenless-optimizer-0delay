import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { FlightOfFancy } from '@zenless-optimizer/zzz/formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'FlightOfFancy'
const [chg, ch] = trans('wengine', key)
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
      type: 'fields',
      header: { icon: null, text: ch('anomBuildup_') },
      fields: [tagToTagField(buff.anomBuildup_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherDmgCond'),
        metadata: cond.etherDmg,
        fields: [tagToTagField(buff.etherDmg_anomProf.tag)],
      },
    },
  ],
}

export default sheet
