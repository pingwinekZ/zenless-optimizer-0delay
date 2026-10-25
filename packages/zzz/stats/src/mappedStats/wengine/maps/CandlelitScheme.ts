import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'CandlelitScheme'
const data_gen = getWengineParams(key)

let o = 0

// Phase params: [CRIT Rate (EX Special), duration, DMG vs enemies below
// Max HP, HP threshold] — e.g. phase 1 is [0.08, 40, 0.15, 0.5].
const dm = {
  exSpecial_critRate_: data_gen[o++],
  duration: data_gen[o++][1],
  hpBelow50_dmg_: data_gen[o++],
  hpThreshold: data_gen[o++][1],
} as const

export default dm
