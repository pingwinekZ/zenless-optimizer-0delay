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

const key: WengineKey = 'BoisterousEchoes'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { enemy_with_anomaly } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Conditional: DMG vs enemies afflicted with an Attribute Anomaly
  registerBuff(
    'dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        enemy_with_anomaly.ifOn(subscript(phase, dm.dmg_))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
