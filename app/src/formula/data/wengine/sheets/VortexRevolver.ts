import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'VortexRevolver'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_exSpecial_daze_',
    ownBuff.combat.dazeInc_.addWithDmgType(
      'exSpecial',
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.exSpecial_daze_))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
