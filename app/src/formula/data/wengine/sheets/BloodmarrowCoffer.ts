import { custom, min, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { own, ownBuff, percent, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'BloodmarrowCoffer'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// When CRIT Rate exceeds 100%, each whole 1% over 100% increases DMG by
// 0.48-0.8% up to 24-40%. The game steps at whole percents: 101% CRIT -> 1
// step, 102% -> 2 steps, etc., so fractional excess is floored away.
// dm.dmg_per_crit_ is already fraction per 1% (0.0048 etc), dm.max_dmg_ is
// cap (0.24 etc); capped excess stored in common.cappedCritExcess_ (0-1)
const sheet = registerWengine(
  key,
  entriesForWengine(key),
  registerBuff(
    'cond_overCrit_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        min(
          prod(
            custom('floor', prod(own.common.cappedCritExcess_, 100)),
            subscript(phase, dm.dmg_per_crit_)
          ),
          percent(subscript(phase, dm.max_dmg_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
