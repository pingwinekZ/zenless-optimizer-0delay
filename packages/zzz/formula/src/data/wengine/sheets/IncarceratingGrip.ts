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

const key: WengineKey = 'IncarceratingGrip'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// Evil Caught Within — "The equipper's CRIT Rate increases." + "When the
// equipper's Basic Attack hits an enemy, their ATK increases, and their DMG
// ignores some of the target's Wind RES for 16s."
const { basicHit } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_crit_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.passive_crit_)))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // Conditional buffs
  registerBuff(
    'cond_atk_',
    ownBuff.combat.atk_.add(
      cmpSpecialtyAndEquipped(
        key,
        basicHit.ifOn(percent(subscript(phase, dm.cond_atk_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'cond_windResIgn_',
    ownBuff.combat.resIgn_.wind.add(
      cmpSpecialtyAndEquipped(
        key,
        basicHit.ifOn(percent(subscript(phase, dm.cond_windResIgn_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
