import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'VortexRevolver'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  exSpecial_daze_: data_gen[o++],
} as const

export default dm
