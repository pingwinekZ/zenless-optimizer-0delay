import { cmpGE, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allNumConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'PuzzleSphere'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// 0 = disabled, 1 = EX Special Attack launched, 2 = + target HP below 50%
const { stacks } = allNumConditionals(key, true, 0, 2)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'launchingExSpecial_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(stacks, 1, percent(subscript(phase, dm.crit_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'targetHpBelow50_exSpecial_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'exSpecial',
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(stacks, 2, percent(subscript(phase, dm.exSpecial_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
