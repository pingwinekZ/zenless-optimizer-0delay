import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'DemaraBatteryMarkII'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_electric_dmg_',
    ownBuff.combat.dmg_.electric.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.passive_electric_dmg_))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
