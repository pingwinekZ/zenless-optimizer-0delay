import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { mappedStats } from '@zenless-optimizer/zzz/stats'
import { allBoolConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'PlumeOfRebirth'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// Hatching Day — "When Anomaly DMG dealt by any squad member to an enemy
// triggers a critical hit, the equipper's Fire DMG increases for 20s."
// Squad-wide trigger, self-only reward (own buff).
const { anomDmgCrit } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_anomProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.passive_anomProf))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // Conditional buffs
  registerBuff(
    'cond_fire_dmg_',
    ownBuff.combat.dmg_.fire.add(
      cmpSpecialtyAndEquipped(
        key,
        anomDmgCrit.ifOn(subscript(phase, dm.cond_fire_dmg_))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
