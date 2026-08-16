import { cmpEq, cmpGE, prod } from '@zenless-optimizer/pando/engine'
import type { DiscSetKey } from '../../../../consts'
import {
  allNumConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'YunkuiTales'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { uponLaunchExSpecialChainOrUlt } = allNumConditionals(key, true, 0, 3)

const sheet = registerDisc(
  key,
  // Handle 2-set effects
  entriesForDisc(key),

  // Conditional buffs
  registerBuff(
    'set4_crit_',
    ownBuff.combat.crit_.add(
      cmpGE(discCount, 4, prod(uponLaunchExSpecialChainOrUlt, percent(0.04)))
    ),
    showCond4Set
  ),
  registerBuff(
    'set4_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.add(
      cmpGE(discCount, 4, cmpEq(uponLaunchExSpecialChainOrUlt, 3, percent(0.1)))
    ),
    showCond4Set
  )
)
export default sheet
