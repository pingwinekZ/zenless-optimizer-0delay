import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
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

const key: WengineKey = 'CandlelitScheme'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// Moment of Fright — "When using an EX Special Attack, the equipper's CRIT
// Rate is increased for 40s." + "The equipper deals more DMG to enemies
// whose current HP is below 50% of their Max HP."
const { exSpecialUsed, hpBelow50 } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'exSpecial_critRate_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(
        key,
        exSpecialUsed.ifOn(percent(subscript(phase, dm.exSpecial_critRate_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'hpBelow50_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        hpBelow50.ifOn(percent(subscript(phase, dm.hpBelow50_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
