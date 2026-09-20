import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'JoyauDore'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  anomProf: data_gen[o++],
  vortexDmg_: data_gen[o++],
  duration: data_gen[o++][1],
  squadBuffThreshold: data_gen[o++][1],
  maxStacks: data_gen[o++][1],
  squadAnomProf: data_gen[o++],
} as const

export default dm
