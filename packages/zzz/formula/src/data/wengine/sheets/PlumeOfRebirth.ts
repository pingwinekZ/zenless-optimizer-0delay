import type { WengineKey } from '@zenless-optimizer/zzz/consts'

import { entriesForWengine, registerWengine } from '../util'

const key: WengineKey = 'PlumeOfRebirth'

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key)

  // TODO: Hatching Day
  // - Anomaly Proficiency +90..126
  // - When any squad member's Anomaly DMG crits: Fire DMG +40%..56% for 20s
)
export default sheet
