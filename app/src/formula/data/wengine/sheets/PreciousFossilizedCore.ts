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

const key: WengineKey = 'PreciousFossilizedCore'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// 0 = disabled, 1 = Enemy HP ≥ 50%, 2 = Enemy HP ≥ 75%
const { enemyHpGE } = allNumConditionals(key, true, 0, 2)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'daze_',
    ownBuff.combat.dazeInc_.add(
      cmpSpecialtyAndEquipped(
        key,
        sum(
          cmpGE(enemyHpGE, 1, subscript(phase, dm.daze_)),
          cmpGE(enemyHpGE, 2, subscript(phase, dm.extra_daze_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
