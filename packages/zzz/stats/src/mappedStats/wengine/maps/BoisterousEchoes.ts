import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'BoisterousEchoes'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  cond_energy: data_gen[o++],
  cooldown: data_gen[o++][1],
  dmg_: data_gen[o++],
} as const

export default dm
