import {
  zodBoolean,
  zodEnumWithDefault,
  zodFilteredArray,
  zodString,
} from '@zenless-optimizer/common/database'
import { z } from 'zod'
import { allSpecialityKeys, allWengineRarityKeys } from '../../../consts'
import type { ZzzDatabase } from '../Database'
import { DataEntry } from '../DataEntry'

export const wengineSortKeys = ['level', 'rarity', 'name'] as const
export type WengineSortKey = (typeof wengineSortKeys)[number]

const displayWengineSchema = z.object({
  editWengineId: zodString(''),
  sortType: zodEnumWithDefault(wengineSortKeys, 'level'),
  ascending: zodBoolean(),
  rarity: zodFilteredArray(allWengineRarityKeys),
  speciality: zodFilteredArray(allSpecialityKeys),
  // locked, showEquipped, showInventory, locations are removed since wengines
  // are now catalog entries (no per-instance inventory management).
})
export type IDisplayWengine = z.infer<typeof displayWengineSchema>

const resetSchema = displayWengineSchema.omit({
  sortType: true,
  ascending: true,
})

export class DisplayWengineEntry extends DataEntry<
  'display_wengine',
  'display_wengine',
  IDisplayWengine,
  IDisplayWengine
> {
  constructor(database: ZzzDatabase) {
    super(
      database,
      'display_wengine',
      () => displayWengineSchema.parse({}),
      'display_wengine'
    )
  }
  override validate(obj: unknown): IDisplayWengine | undefined {
    const result = displayWengineSchema.safeParse(obj)
    return result.success ? result.data : undefined
  }
  override set(
    value:
      | Partial<IDisplayWengine>
      | ((v: IDisplayWengine) => Partial<IDisplayWengine> | void)
      | { action: 'reset' }
  ): boolean {
    if ('action' in value) {
      if (value.action === 'reset') return super.set(resetSchema.parse({}))
      return false
    } else return super.set(value)
  }
}
