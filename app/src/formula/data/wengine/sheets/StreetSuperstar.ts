import { prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allNumConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'StreetSuperstar'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { charge } = allNumConditionals(key, true, 0, dm.max_stack)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'cond_ult_dmg_',
    ownBuff.combat.common_dmg_.addWithDmgType(
      'ult',
      cmpSpecialtyAndEquipped(key, prod(charge, subscript(phase, dm.dmg_)))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
