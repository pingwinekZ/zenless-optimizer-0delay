import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  notOwnBuff,
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

const key: WengineKey = 'CrimsonMoonCasket'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { exSpecialWindHit } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_crit_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.crit_)))
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'passive_windResIgn_',
    ownBuff.combat.resIgn_.wind.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.windResIgn_)))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // Conditional buffs: triggered when the equipper uses an EX Special Attack
  // to deal Wind DMG. The team DMG buff applies to all other squad members
  // (`notOwnBuff`); note `addOnce` only supports `teamBuff`, so stacking
  // dedup is not applied — acceptable for a Stun-gated signature engine.
  registerBuff(
    'cond_dazeInc_',
    ownBuff.combat.dazeInc_.add(
      cmpSpecialtyAndEquipped(
        key,
        exSpecialWindHit.ifOn(percent(subscript(phase, dm.dazeInc_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'cond_teamDmg_',
    notOwnBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        exSpecialWindHit.ifOn(percent(subscript(phase, dm.teamDmg_)))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
