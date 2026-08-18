import type { DiscSetKey } from '../../../../consts'
import { entriesForDisc, registerDisc } from '../util'

const key: DiscSetKey = 'SoulRock'

const sheet = registerDisc(key, entriesForDisc(key))
export default sheet
