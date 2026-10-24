import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import { register } from '../../util'
import { entriesForChar, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Severian'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

// TODO: implement the core passive (Flow / Shadowflash), the additional
// ability, and the mindscape buffs. Base stats, core stats and M3/M5 are
// handled by `entriesForChar`; every skill's damage/daze/anomaly is registered
// below.
const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm)
)
export default sheet
