import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allBoolConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'MagneticStormAlpha'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { anomalyBuildupIncreased } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional buffs
  registerBuff(
    'anomMas',
    ownBuff.combat.anomMas.add(
      cmpSpecialtyAndEquipped(
        key,
        anomalyBuildupIncreased.ifOn(subscript(phase, dm.anomMas))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
