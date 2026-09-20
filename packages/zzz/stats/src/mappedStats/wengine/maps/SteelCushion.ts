import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'SteelCushion'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  physical_dmg_: data_gen[o++],
  dmg_: data_gen[o++],
} as const

export default dm
