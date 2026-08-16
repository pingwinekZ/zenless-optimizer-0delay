import { cmpEq, cmpGE, prod } from '@zenless-optimizer/pando/engine'
import type { DiscSetKey } from '../../../../consts'
import {
  allNumConditionals,
  own,
  percent,
  registerBuff,
  teamBuff,
} from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'BunnyInWonderland'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { stacks } = allNumConditionals(key, true, 0, 3)

const sheet = registerDisc(
  key,
  entriesForDisc(key),

  // 4pc: Defense char triggers, stacks up to 3x (+6% each)
  registerBuff(
    'set4_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpGE(
        discCount,
        4,
        cmpEq(own.char.specialty, 'defense', prod(stacks, percent(0.06)))
      )
    ),
    showCond4Set,
    true
  )
)
export default sheet
