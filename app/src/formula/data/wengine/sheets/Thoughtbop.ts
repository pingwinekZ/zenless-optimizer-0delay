import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allNumConditionals,
  own,
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

const key: WengineKey = 'Thoughtbop'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { physExSpecialUsed } = allNumConditionals(key, true, 0, dm.maxStacks)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'team_common_dmg_',
    teamBuff.combat.common_dmg_.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        prod(physExSpecialUsed, percent(subscript(phase, dm.common_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  ),
  registerBuff(
    'team_atk_',
    teamBuff.combat.atk_.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(physExSpecialUsed, dm.stackThreshold, subscript(phase, dm.atk_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
