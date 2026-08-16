import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'ChiefSidekick'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  impact: data_gen[o++],
  fireResIgn_: data_gen[o++],
  offFieldEnerRegen: data_gen[o++],
  teamDmg_: data_gen[o++],
  duration: data_gen[o++][1],
  maxStacks: data_gen[o++][1],
} as const

export default dm
