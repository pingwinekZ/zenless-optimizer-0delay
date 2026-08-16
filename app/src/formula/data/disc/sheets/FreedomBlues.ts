import { cmpEq, cmpGE, sum } from '@zenless-optimizer/pando/engine'
import { allAttributeKeys, type DiscSetKey } from '../../../../consts'
import { allBoolConditionals, enemyDebuff, own, registerBuff } from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'FreedomBlues'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const { exSpecialHit } = allBoolConditionals(key)

// Only apply the debuff to the equipper's attribute
// Description: "reduce the target's Anomaly Buildup RES to the equipper's Attribute"
const debuffValue = cmpGE(discCount, 4, exSpecialHit.ifOn(-0.2))
const conditionalDebuff = sum(
  ...allAttributeKeys.map((attr) =>
    cmpEq(own.char.attribute, attr, debuffValue)
  )
)

const sheet = registerDisc(
  key,
  // Handle 2-set effects
  entriesForDisc(key),

  // Conditional buffs
  registerBuff(
    'anomBuildupRes_',
    enemyDebuff.common.anomBuildupRes_.add(conditionalDebuff),
    showCond4Set,
    true // enemy debuff affects enemy, benefiting all attackers
  )
)
export default sheet
