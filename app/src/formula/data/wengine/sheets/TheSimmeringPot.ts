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

const key: WengineKey = 'TheSimmeringPot'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { assistFollowUp } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Daze from Assist Follow-Up
  registerBuff(
    'assistFollowUp_daze_',
    ownBuff.combat.dazeInc_.add(
      cmpSpecialtyAndEquipped(
        key,
        assistFollowUp.ifOn(subscript(phase, dm.daze))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  // DMG from Assist Follow-Up
  registerBuff(
    'assistFollowUp_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        assistFollowUp.ifOn(subscript(phase, dm.dmg))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
