import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'HalfSugarBunny'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { activateExtendEtherVeil } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'passive_enerRegen',
    ownBuff.combat.enerRegen.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.enerRegen)))
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'passive_atk_',
    teamBuff.combat.atk_.addOnce(
      key,
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.atk_)))
    ),
    showSpecialtyAndEquipped(key),
    true
  ),
  registerBuff(
    'passive_hp_',
    teamBuff.combat.hp_.addOnce(
      key,
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.hp_)))
    ),
    showSpecialtyAndEquipped(key),
    true
  ),
  registerBuff(
    'cond_crit_dmg_',
    teamBuff.combat.crit_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        activateExtendEtherVeil.ifOn(percent(subscript(phase, dm.crit_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
