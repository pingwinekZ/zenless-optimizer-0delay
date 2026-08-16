import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allBoolConditionals, own, registerBuff, teamBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'UnfetteredGameBall'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { anomaly_counter } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'cond_crit_',
    teamBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(
        key,
        anomaly_counter.ifOn(subscript(phase, dm.crit_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
