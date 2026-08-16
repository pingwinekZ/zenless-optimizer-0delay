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

const key: WengineKey = 'OdeOfResurrectedWings'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { refringe_triggered } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive: Anomaly Proficiency +96/105/115/125/135 (phase-scaled)
  registerBuff(
    'anomProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.anomProf))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // On Refringe: Anomaly DMG +20/23/26/29/32% for 30s (self)
  registerBuff(
    'anomDmg_',
    ownBuff.combat.buff_.addWithDmgType(
      'anomaly',
      cmpSpecialtyAndEquipped(
        key,
        refringe_triggered.ifOn(percent(subscript(phase, dm.anomDmg_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  // On Refringe: All squad members DMG +30/34.5/39/43.5/48% for 30s
  registerBuff(
    'teamDmg_',
    teamBuff.combat.common_dmg_.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        refringe_triggered.ifOn(subscript(phase, dm.teamDmg_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
