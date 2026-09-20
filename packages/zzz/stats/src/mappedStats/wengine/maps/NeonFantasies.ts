import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'NeonFantasies'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  anomalyProf: data_gen[o++], // 90 - Base Anomaly Prof
  squadDmg: data_gen[o++], // 0.15 - 15% squad DMG
  duration: data_gen[o++], // 40 - 40s duration
  stacks: data_gen[o++][1], // 2 - max stacks
  stackThreshold: data_gen[o++], // 2 - stacks needed for bonus
  addlAnomalyProf: data_gen[o++], // 60 - additional Anomaly Prof at 2 stacks
} as const

export default dm
