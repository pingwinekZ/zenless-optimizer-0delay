import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allNumConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'KnightsExtolment'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// Battle Edge stacks: max 2, each skill type provides up to 1 stack
const { battle_edge_stacks } = allNumConditionals(key, true, 0, dm.maxStacks)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // On Basic/EX Special heavy hit: 1 stack of Battle Edge
  // Per stack: CRIT DMG +32/36.8/41.6/46.4/51.2% for 25s
  registerBuff(
    'critDmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        prod(battle_edge_stacks, subscript(phase, dm.critDmg_))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  // At 2 stacks of Battle Edge (Bonechill):
  // DMG ignores 20/23/26/29/32% of target's Ice RES
  registerBuff(
    'iceResIgn_',
    ownBuff.combat.resIgn_.ice.add(
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(
          battle_edge_stacks,
          dm.bonechillThreshold,
          subscript(phase, dm.iceResIgn_)
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
