import type { WengineKey } from '../../../consts'
import { allWengineKeys } from '../../../consts'
import type { ICachedWengine } from '../../Interfaces/IDbWengine'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

/**
 * WengineDataManager is a catalog of all wengine keys, auto-populated at
 * level 60, modification 5, phase 1. No per-instance inventory — characters
 * reference wengine key + phase directly from their own data.
 *
 * The `data` entries contain ICachedWengine objects keyed by WengineKey
 * (the string value of the key). Each wengine is always at max level/refinement.
 */
export class WengineDataManager extends DataManager<
  string,
  'wengines',
  ICachedWengine,
  ICachedWengine
> {
  constructor(database: ZzzDatabase) {
    super(database, 'wengines')
    // Auto-populate all wengine keys on initialization
    for (const key of allWengineKeys) {
      if (!this.get(key)) {
        this.set(key, initialWengine(key))
      }
    }
  }

  override validate(obj: unknown): ICachedWengine | undefined {
    if (
      obj &&
      typeof obj === 'object' &&
      'key' in obj &&
      'level' in obj &&
      'modification' in obj &&
      'phase' in obj
    ) {
      return obj as ICachedWengine
    }
    return undefined
  }

  override toCache(storageObj: ICachedWengine, id: string): ICachedWengine {
    return { ...storageObj, id }
  }

  override deCache(wengine: ICachedWengine): ICachedWengine {
    return { ...wengine, id: '' }
  }

  override remove(key: string): ICachedWengine | undefined {
    // Wengine catalog entries cannot be removed; they are always present
    return this.get(key)
  }
}

export const initialWengine = (key: WengineKey): ICachedWengine => ({
  id: key,
  key,
  level: 60,
  modification: 5,
  phase: 1,
})
