import { cmpGE, subscript, sum } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allNumConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'MarcatoDesire'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// 0 = disabled, 1 = EX Special/Chain hit, 2 = + target under Attribute Anomaly
const { stacks } = allNumConditionals(key, true, 0, 2)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key), // Main ATK: EX Special Attack or Chain Attack hits an enemy.
  // Additional ATK: while the target is under an Attribute Anomaly.
  registerBuff(
    'atk_',
    ownBuff.combat.atk_.add(
      cmpSpecialtyAndEquipped(
        key,
        sum(
          cmpGE(stacks, 1, subscript(phase, dm.atk_)),
          cmpGE(stacks, 2, subscript(phase, dm.extra_atk_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
