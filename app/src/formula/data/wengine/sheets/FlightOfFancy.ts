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

const key: WengineKey = 'FlightOfFancy'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { etherDmg } = allNumConditionals(key, true, 0, dm.stacks)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'anomBuildup_',
    ownBuff.combat.anomBuildup_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.anomBuildup_))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // Conditional buffs
  registerBuff(
    'etherDmg_anomProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(
        key,
        prod(etherDmg, subscript(phase, dm.anomProf))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
