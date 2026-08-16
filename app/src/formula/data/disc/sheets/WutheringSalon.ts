import { cmpGE, prod } from '@zenless-optimizer/pando/engine'
import type { DiscSetKey } from '../../../../consts'
import {
  allBoolConditionals,
  allNumConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'WutheringSalon'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { windswept_active } = allBoolConditionals(key)
const { ex_anom_prof_stacks } = allNumConditionals(key, true, 0, 2)

const sheet = registerDisc(
  key,
  // Handle 2-set effects
  entriesForDisc(key),

  // 4-set: When equipper triggers Windswept, DMG +18% for 40s
  registerBuff(
    'set4_windswept_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpGE(discCount, 4, windswept_active.ifOn(percent(0.18)))
    ),
    showCond4Set
  ),
  // 4-set: When equipper uses EX Special Attack, Anomaly Proficiency +25 per stack, max 2 stacks, 40s
  registerBuff(
    'set4_anom_prof',
    ownBuff.combat.anomProf.add(
      cmpGE(discCount, 4, prod(ex_anom_prof_stacks, 25))
    ),
    showCond4Set
  )
)
export default sheet
