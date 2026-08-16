import type { WengineKey } from '../../../../consts'

import { entriesForWengine, registerWengine } from '../util'

const key: WengineKey = 'SliceOfTime'

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key)

  // Conditional buffs
  // TODO: decibal
  // TODO: energy
)
export default sheet
