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

const key: WengineKey = 'CrimsonThirst'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { exOrMaim } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  entriesForWengine(key),
  registerBuff(
    'passive_crit_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.crit_)))
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'passive_electric_dmg_',
    ownBuff.combat.dmg_.electric.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.electric_dmg_)))
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'cond_electric_sharp_dmg_',
    ownBuff.combat.sharp_dmg_.electric.add(
      cmpSpecialtyAndEquipped(
        key,
        exOrMaim.ifOn(percent(subscript(phase, dm.electric_sharp_dmg_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
