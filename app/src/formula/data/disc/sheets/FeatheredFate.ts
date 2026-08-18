import { cmpEq, cmpGE } from '@zenless-optimizer/pando/engine'
import type { DiscSetKey } from '../../../../consts'
import { own, ownBuff, percent, registerBuff } from '../../util'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'FeatheredFate'

const discCount = own.common.count.sheet(key)
const showCond4Set = cmpGE(discCount, 4, 'infer', '')

const sheet = registerDisc(
  key,
  // Handle 2-set effects (Anomaly Proficiency +30)
  entriesForDisc(key),

  // 4-set: Anomaly Proficiency +50. Buff persists while off-field.
  registerBuff(
    'set4_anomProf',
    ownBuff.combat.anomProf.add(cmpGE(discCount, 4, 50)),
    showCond4Set
  ),
  // 4-set: If Lumiflux character, Attribute Anomaly DMG +15%.
  // Buff persists while off-field.
  registerBuff(
    'set4_anom_dmg_',
    ownBuff.combat.anom_base_.add(
      cmpEq(own.char.attribute, 'lumiflux', cmpGE(discCount, 4, percent(0.15)))
    ),
    showCond4Set
  )
)
export default sheet
