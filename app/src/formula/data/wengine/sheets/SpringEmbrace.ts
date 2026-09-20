import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { mappedStats } from '@zenless-optimizer/zzz/stats'
import { own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'SpringEmbrace'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive buffs
  registerBuff(
    'passive_dmg_red_',
    ownBuff.combat.dmg_red_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.dmg_red_))
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
