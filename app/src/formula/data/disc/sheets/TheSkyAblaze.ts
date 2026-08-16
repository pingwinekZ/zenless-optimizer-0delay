import { cmpGE } from '@zenless-optimizer/pando/engine'
import type { DiscSetKey } from '../../../../consts'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'TheSkyAblaze'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { ether_crit_dmg_active, ex_ult_atk_active } = allBoolConditionals(key)

const sheet = registerDisc(
  key,
  // Handle 2-set effects
  entriesForDisc(key),

  // 4-set: When equipper is Ether attribute, CRIT DMG +30%
  registerBuff(
    'set4_ether_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(discCount, 4, ether_crit_dmg_active.ifOn(percent(0.3)))
    ),
    showCond4Set
  ),
  // 4-set: When equipper uses EX Special Attack or Ultimate, ATK +10% for 30s
  registerBuff(
    'set4_ex_ult_atk_',
    ownBuff.combat.atk_.add(
      cmpGE(discCount, 4, ex_ult_atk_active.ifOn(percent(0.1)))
    ),
    showCond4Set
  )
)
export default sheet
