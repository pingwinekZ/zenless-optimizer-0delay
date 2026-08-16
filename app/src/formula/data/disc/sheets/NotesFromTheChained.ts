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

const key: DiscSetKey = 'NotesFromTheChained'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { abloom, freeze_shatter } = allBoolConditionals(key)

const sheet = registerDisc(
  key,
  entriesForDisc(key),

  registerBuff(
    'set4_abloom_anomProf',
    ownBuff.combat.anomProf.add(cmpGE(discCount, 4, abloom.ifOn(48))),
    showCond4Set
  ),
  registerBuff(
    'set4_freeze_anomDmg',
    ownBuff.combat.buff_.addWithDmgType(
      'anomaly',
      cmpGE(discCount, 4, freeze_shatter.ifOn(percent(0.16)))
    ),
    showCond4Set
  ),
  registerBuff(
    'set4_freeze_disorderDmg',
    ownBuff.combat.addl_disorder_.add(
      cmpGE(discCount, 4, freeze_shatter.ifOn(percent(0.16)))
    ),
    showCond4Set
  )
)
export default sheet
