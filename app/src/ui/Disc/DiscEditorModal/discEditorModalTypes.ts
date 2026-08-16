import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
  LocationKey,
} from '../../../consts'
import type { ICachedDisc } from '../../../db'

export type DiscEditorForm = {
  setKey: DiscSetKey
  slotKey: DiscSlotKey
  rarity: DiscRarityKey
  level: number
  mainStatKey: DiscMainStatKey
  substatKey0: DiscSubStatKey | ''
  substatKey1: DiscSubStatKey | ''
  substatKey2: DiscSubStatKey | ''
  substatKey3: DiscSubStatKey | ''
  substatUpgrade0: number
  substatUpgrade1: number
  substatUpgrade2: number
  substatUpgrade3: number
  location: LocationKey
  lock: boolean
}

export type SubstatUpgradeValues = {
  upgrades: number[]
  totals: number[]
}

export type DiscEditorConfig = {
  selectedDisc: ICachedDisc | null
  slotKey?: DiscSlotKey
  characterKey?: CharacterKey
  onOk: (disc: ICachedDisc) => void
  next?: () => void
  prev?: () => void
}
