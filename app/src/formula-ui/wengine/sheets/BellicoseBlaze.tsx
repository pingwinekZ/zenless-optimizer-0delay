import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { BellicoseBlaze } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'BellicoseBlaze'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = BellicoseBlaze.conditionals
const buff = BellicoseBlaze.buffs

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
        label: ch('fireAftershockCond'),
        metadata: cond.fire_aftershocks,
        fields: [tagToTagField(buff.cond_fire_aftershock_defIgn_.tag)],
      },
    },
  ],
}

export default sheet
