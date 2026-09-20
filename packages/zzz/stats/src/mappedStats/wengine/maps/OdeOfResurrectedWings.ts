import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'OdeOfResurrectedWings'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  anomProf: data_gen[o++], // params[0]: [-1, 96, 105, 115, 125, 135]
  anomDmg_: data_gen[o++], // params[1]: [-1, 0.2, 0.23, 0.26, 0.29, 0.32]
  teamDmg_: data_gen[o++], // params[2]: [-1, 0.3, 0.345, 0.39, 0.435, 0.48]
  duration: data_gen[o++][1], // params[3]: 30 (constant)
} as const

export default dm
