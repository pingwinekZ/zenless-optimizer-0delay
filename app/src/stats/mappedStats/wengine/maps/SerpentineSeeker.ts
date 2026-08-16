import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'SerpentineSeeker'
const data_gen = getWengineParams(key)

let o = 0

const dm = {
  critRate: data_gen[o++], // 0.25 - 25% CRIT Rate
  energyThresh: data_gen[o++], // 20 - Energy threshold
  energyPerGrant: data_gen[o++], // 20 - Energy per grant
  durationPerGrant: data_gen[o++], // 3 - 3s per 20 energy
  defIgnore: data_gen[o++], // 0.28 - 28% DEF ignore
  maxDuration: data_gen[o++], // 30 - 30s max duration
  initialDuration: data_gen[o++], // 10 - 10s initial buff
} as const

export default dm
