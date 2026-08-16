import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allNumConditionals,
  own,
  ownBuff,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'JoyauDore'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { wind_ex_stacks } = allNumConditionals(key, true, 0, dm.maxStacks)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive: Anomaly Proficiency
  registerBuff(
    'anomProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.anomProf))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Conditional: Vortex DMG per stack
  registerBuff(
    'vortexDmg_',
    ownBuff.combat.dmg_.vortex.map((r) =>
      r.add(
        cmpSpecialtyAndEquipped(
          key,
          prod(wind_ex_stacks, subscript(phase, dm.vortexDmg_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Conditional: Windswept DMG per stack
  registerBuff(
    'windsweptDmg_',
    ownBuff.combat.dmg_.windswept.map((r) =>
      r.add(
        cmpSpecialtyAndEquipped(
          key,
          prod(wind_ex_stacks, subscript(phase, dm.vortexDmg_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Anomaly Proficiency at max stacks (team-wide)
  registerBuff(
    'squadAnomProf',
    teamBuff.combat.anomProf.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(
          wind_ex_stacks,
          dm.squadBuffThreshold,
          subscript(phase, dm.squadAnomProf)
        )
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
