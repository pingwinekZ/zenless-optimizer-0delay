import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { createBaseSheet } from '../sheetUtil'

const key: CharacterKey = 'Phoenix'

// TODO: implement the sheet documents for the core passive (Pyre /
// Combustion Attacks), the additional ability and the mindscapes once the
// formula sheet registers those conditionals/buffs. Only the auto-generated
// skills, core and mindscape documents are shown for now.
const sheet = createBaseSheet(key)

export default sheet
