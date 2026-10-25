import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'IncarceratingGrip'
const data_gen = getWengineParams(key)

let o = 0

// Phase params: [CRIT Rate, ATK (on Basic hit), Wind RES ignore (on Basic
// hit), duration] — e.g. phase 1 is [0.2, 0.1, 0.15, 16].
const dm = {
  passive_crit_: data_gen[o++],
  cond_atk_: data_gen[o++],
  cond_windResIgn_: data_gen[o++],
  duration: data_gen[o++][1],
} as const

export default dm
