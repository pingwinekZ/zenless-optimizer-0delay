import type { WengineKey } from '@zenless-optimizer/zzz/consts'

import { entriesForWengine, registerWengine } from '../util'

const key: WengineKey = 'CandlelitScheme'

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key)

  // TODO: Moment of Fright
  // - On EX Special Attack, CRIT Rate +8%..12.8% for 40s
  // - DMG +15%..24% against enemies below 50% Max HP
)
export default sheet
