import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allBoolConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'VortexHatchet'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { entering } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'cond_impact_',
    ownBuff.combat.impact_.add(
      cmpSpecialtyAndEquipped(key, entering.ifOn(subscript(phase, dm.impact_)))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
