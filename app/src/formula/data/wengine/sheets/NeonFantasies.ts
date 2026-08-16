import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allNumConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'NeonFantasies'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { stacks } = allNumConditionals(key, true, 0, dm.stacks)

const sheet = registerWengine(
  key,
  entriesForWengine(key),

  // Squad DMG: 15% per stack (scales with stacks)
  registerBuff(
    'squadDmg_',
    teamBuff.combat.common_dmg_.addOnce(
      key,
      cmpSpecialtyAndEquipped(
        key,
        prod(stacks, percent(subscript(phase, dm.squadDmg)))
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  ),
  // Base Anomaly Prof: always active
  registerBuff(
    'anomalyProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.anomalyProf))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Additional Anomaly Prof: only at 2 stacks
  registerBuff(
    'maxStacks_anomalyProf',
    ownBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(stacks, 2, subscript(phase, dm.addlAnomalyProf))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)

export default sheet
