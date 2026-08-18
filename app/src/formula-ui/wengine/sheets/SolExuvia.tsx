import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { SolExuvia } from '../../../formula'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'SolExuvia'
const [chg, ch] = trans('wengine', key)
const icon = wengineAsset(key)
const cond = SolExuvia.conditionals
const buff = SolExuvia.buffs

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
      header: { icon: null, text: ch('crit_') },
      fields: [tagToTagField(buff.crit_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('eclipseActiveCond'),
        metadata: cond.eclipse_active,
        fields: [tagToTagField(buff.etherResIgn_.tag)],
      },
    },
  ],
}

export default sheet
