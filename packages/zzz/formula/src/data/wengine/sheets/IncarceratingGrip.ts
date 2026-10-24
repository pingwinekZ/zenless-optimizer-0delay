import type { WengineKey } from '@zenless-optimizer/zzz/consts'

import { entriesForWengine, registerWengine } from '../util'

const key: WengineKey = 'IncarceratingGrip'

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key)

  // TODO: Evil Caught Within
  // - CRIT Rate +20%..32%
  // - On Basic Attack hit: ATK +10%..16% and ignore 15%..24% Wind RES for 16s
)
export default sheet
