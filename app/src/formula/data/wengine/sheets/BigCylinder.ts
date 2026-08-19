import { prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customDmg,
  own,
  ownBuff,
  registerBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'BigCylinder'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// After being attacked, the next attack to hit an enemy will trigger a
// critical hit and deal additional DMG. While active, the equipper's next
// attack always crits (100% CRIT Rate).
const { afterAttacked } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_dmg_red_',
    ownBuff.combat.dmg_red_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.dmg_red_))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // Conditional buffs
  ...customDmg(
    'damage',
    { damageType1: 'elemental' },
    cmpSpecialtyAndEquipped(
      key,
      prod(own.final.def, subscript(phase, dm.dmg_scaling))
    ),
    { cond: showSpecialtyAndEquipped(key) }
  ),
  registerBuff(
    'cond_crit_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, afterAttacked.ifOn(1))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
