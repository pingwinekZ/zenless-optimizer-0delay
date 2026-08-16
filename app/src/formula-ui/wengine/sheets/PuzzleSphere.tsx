import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { PuzzleSphere } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'PuzzleSphere'
const [chg] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = PuzzleSphere.conditionals
const buff = PuzzleSphere.buffs

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
        label: st('uponLaunch.1', { val1: '$t(skills.exSpecial)' }),
        metadata: cond.launchingExSpecial,
        fields: [
          tagToTagField(buff.launchingExSpecial_crit_dmg_.tag),
          {
            title: st('duration'),
            fieldValue: dm.duration,
          },
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: st('targetHpLe', { val: dm.hpThresh * 100 }),
        metadata: cond.targetHpBelow50,
        fields: [tagToTagField(buff.targetHpBelow50_exSpecial_dmg_.tag)],
      },
    },
  ],
}

export default sheet
