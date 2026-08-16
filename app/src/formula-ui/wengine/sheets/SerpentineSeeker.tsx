import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { SerpentineSeeker } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'SerpentineSeeker'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = SerpentineSeeker.conditionals
const buff = SerpentineSeeker.buffs

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
      header: { icon: null, text: ch('critRate_') },
      fields: [tagToTagField(buff.critRate_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('energyConsumedCond'),
        metadata: cond.energyConsumed20,
        fields: [tagToTagField(buff.electric_defIgn_.tag)],
      },
    },
  ],
}

export default sheet
