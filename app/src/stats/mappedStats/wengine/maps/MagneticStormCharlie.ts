import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'MagneticStormCharlie'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  energy: data_gen[o++],
  cooldown: data_gen[o++][1],
} as const

export default dm
