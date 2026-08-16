import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ChiefSidekick } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ChiefSidekick'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = ChiefSidekick.conditionals
const buff = ChiefSidekick.buffs

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
      fields: [
        tagToTagField(buff.impact.tag),
        tagToTagField(buff.fireResIgn_.tag),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('offFieldCond'),
        metadata: cond.offField,
        fields: [tagToTagField(buff.offFieldEnerRegen.tag)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exFireStacksCond'),
        metadata: cond.ex_fire_stacks,
        fields: [
          tagToTagField(buff.teamDmg_.tag),
          {
            title: 'Duration',
            fieldValue: dm.duration,
          },
        ],
      },
    },
  ],
}

export default sheet
