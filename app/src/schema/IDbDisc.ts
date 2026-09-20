import type { DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type { IDisc } from './disc'

export interface ICachedDisc extends IDisc {
  id: string
}

export type DiscIds = Record<DiscSlotKey, string | undefined>
