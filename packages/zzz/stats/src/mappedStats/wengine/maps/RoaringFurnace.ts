import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'RoaringFurnace'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  exSpecial_chain_ult_dazeInc_: data_gen[o++],
  dmg_: data_gen[o++],
  maxStacks: data_gen[o++][1],
  duration: data_gen[o++][1],
} as const

export default dm
