import { prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { customDmg, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'CannonRotor'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  ...customDmg(
    'damage',
    { damageType1: 'elemental' },
    cmpSpecialtyAndEquipped(
      key,
      prod(own.final.atk, subscript(phase, dm.dmg_scaling))
    ),
    { cond: showSpecialtyAndEquipped(key) },
    ownBuff.combat.crit_.add(1)
  ),
  registerBuff(
    'passive_atk_',
    ownBuff.combat.atk_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.passive_atk_))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
