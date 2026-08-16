import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { QingmingBirdcage } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'QingmingBirdcage'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = QingmingBirdcage.conditionals
const buff = QingmingBirdcage.buffs

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
        metadata: cond.qingmingCompanionStacks,
        label: ch('qingmingCompanionStacksCond'),
        fields: [
          tagToTagField(buff.qingmingCompanionStacks_ether_dmg_.tag),
          tagToTagField(buff.qingmingCompanionStacks_ult_ether_sheer_dmg_.tag),
          tagToTagField(
            buff.qingmingCompanionStacks_exSpecial_ether_sheer_dmg_.tag
          ),
          {
            title: 'Duration', // TODO: L10n
            fieldValue: dm.duration,
          },
        ],
      },
    },
  ],
}

export default sheet
