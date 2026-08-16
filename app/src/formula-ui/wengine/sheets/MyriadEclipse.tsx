import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { MyriadEclipse } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'MyriadEclipse'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = MyriadEclipse.conditionals
const buff = MyriadEclipse.buffs

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
      fields: [tagToTagField(buff.crit_dmg_.tag)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('deathSentenceCond'),
        metadata: cond.deathSentence,
        fields: [
          tagToTagField(buff.deathSentence_defIgn_.tag),
          {
            title: st('duration'),
            fieldValue: dm.duration,
          },
        ],
      },
    },
  ],
}

export default sheet
