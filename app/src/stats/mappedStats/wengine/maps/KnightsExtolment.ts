import type { WengineKey } from '../../../../consts'
import { getWengineParams } from '../../../wengine'

const key: WengineKey = 'KnightsExtolment'
const data_gen = getWengineParams(key)

let o = 0

o++ // skip params[0] — leading flag (always 1, indicates effect has a threshold)

const dm = {
  critDmg_: data_gen[o++], // params[1]: [-1, 0.32, 0.368, 0.416, 0.464, 0.512]
  duration: data_gen[o++][1], // params[2]: 25 (constant)
  maxStacks: data_gen[o++][1], // params[3]: 2 max stacks (constant)
  perSkillStack: data_gen[o++][1], // params[4]: 1 per skill type (constant)
  bonechillThreshold: data_gen[o++][1], // params[5]: 2 stacks for Bonechill (constant)
  iceResIgn_: data_gen[o++], // params[6]: [-1, 0.2, 0.23, 0.26, 0.29, 0.32]
} as const

export default dm
