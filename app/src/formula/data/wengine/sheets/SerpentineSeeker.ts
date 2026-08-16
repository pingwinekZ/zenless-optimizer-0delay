import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'SerpentineSeeker'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { energyConsumed20 } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  entriesForWengine(key),

  // Base CRIT Rate from wengine
  registerBuff(
    'critRate_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.critRate))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // DEF ignore toggle when consuming 20+ energy, for Electric DMG
  registerBuff(
    'electric_defIgn_',
    ownBuff.combat.defIgn_.electric.add(
      cmpSpecialtyAndEquipped(
        key,
        energyConsumed20.ifOn(percent(subscript(phase, dm.defIgnore)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
