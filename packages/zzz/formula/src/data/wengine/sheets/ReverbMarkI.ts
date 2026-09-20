import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { mappedStats } from '@zenless-optimizer/zzz/stats'
import { allBoolConditionals, own, registerBuff, teamBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'ReverbMarkI'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { exSpecialUsed } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'impact_',
    teamBuff.combat.impact_.add(
      cmpSpecialtyAndEquipped(
        key,
        exSpecialUsed.ifOn(subscript(phase, dm.impact_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
