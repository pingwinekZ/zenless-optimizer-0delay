import type { DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type { ICharacter } from '@zenless-optimizer/zzz/zood'

export interface ICharMeta {
  description: string
}

export interface ICachedCharacter extends ICharacter {
  equippedDiscs: Record<DiscSlotKey, string | undefined>
}
