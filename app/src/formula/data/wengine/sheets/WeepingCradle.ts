import { prod, subscript, sum } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  own,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'WeepingCradle'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { attack } = allBoolConditionals(key)
const { stacks } = allNumConditionals(key, true, 0, 6)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'cond_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        attack.ifOn(
          sum(
            subscript(phase, dm.dmg_),
            prod(stacks, subscript(phase, dm.inc_dmg_))
          )
        )
      )
    ),
    showSpecialtyAndEquipped(key),
    true
  )
)
export default sheet
