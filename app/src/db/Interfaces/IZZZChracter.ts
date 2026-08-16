import type { DiscSlotKey } from '../../consts'
import type { ICharacter } from '../../zood'

export interface ICharMeta {
  description: string
}

export interface ICachedCharacter extends ICharacter {
  equippedDiscs: Record<DiscSlotKey, string | undefined>
}
