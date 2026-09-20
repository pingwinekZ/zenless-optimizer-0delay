import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'CrimsonMoonCasket'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  crit_: data_gen[o++], // 0.24 - 24% CRIT Rate
  windResIgn_: data_gen[o++], // 0.15 - 15% Wind RES ignore
  dazeInc_: data_gen[o++], // 0.16 - 16% Daze dealt
  teamDmg_: data_gen[o++], // 0.20 - 20% other members' DMG
  duration: data_gen[o++]?.[1] ?? 0, // 50 - buff duration (s)
} as const

export default dm
