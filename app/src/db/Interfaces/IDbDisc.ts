import type { DiscSlotKey } from '../../consts'
import type { IDisc } from '../../zood'

export interface ICachedDisc extends IDisc {
  id: string
}

export type DiscIds = Record<DiscSlotKey, string | undefined>
