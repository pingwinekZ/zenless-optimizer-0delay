import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'PlumeOfRebirth'
const data_gen = getWengineParams(key)

let o = 0

// Phase params: [Anomaly Proficiency, Fire DMG, duration] — e.g. phase 1 is
// [90, 0.4, 20] (AP flat, Fire DMG as a fraction, seconds).
const dm = {
  passive_anomProf: data_gen[o++],
  cond_fire_dmg_: data_gen[o++],
  duration: data_gen[o++][1],
} as const

export default dm
