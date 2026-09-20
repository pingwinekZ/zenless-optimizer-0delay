import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'TheSimmeringPot'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  daze: data_gen[o++], // 0.072 - 7.2% Daze
  dmg: data_gen[o++], // 0.072 - 7.2% DMG
  duration: data_gen[o++], // 30 - 30s duration
} as const

export default dm
