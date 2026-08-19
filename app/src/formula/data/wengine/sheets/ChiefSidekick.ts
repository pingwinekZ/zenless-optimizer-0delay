import { prod, subscript } from '@zenless-optimizer/pando/engine'
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

const key: WengineKey = 'ChiefSidekick'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { ex_fire_stacks } = allNumConditionals(key, true, 0, dm.maxStacks)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive: Impact
  registerBuff(
    'impact',
    ownBuff.base.impact.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.impact))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Passive: Fire RES ignore
  registerBuff(
    'fireResIgn_',
    ownBuff.combat.resIgn_.fire.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.fireResIgn_))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Conditional: Team DMG per stack
  registerBuff(
    'teamDmg_',
    teamBuff.combat.common_dmg_.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        prod(ex_fire_stacks, subscript(phase, dm.teamDmg_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
