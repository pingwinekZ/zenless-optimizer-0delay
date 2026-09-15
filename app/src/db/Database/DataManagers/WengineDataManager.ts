import type { WengineKey } from '../../../consts'
import { allWengineKeys } from '../../../consts'
import type { ICachedWengine } from '../../Interfaces/IDbWengine'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

/**
 * WengineDataManager is an in-memory catalog of all wengine keys,
 * auto-populated at level 60, modification 5, phase 1. No per-instance
 * inventory — characters reference wengine key + phase directly from their
 * own data, and selection UIs read the static key list, so nothing here is
 * persisted to storage or exports: the catalog is rebuilt from scratch on
 * every load.
 *
 * `importZOOD` is intentionally kept functional so importing a ZOOD file
 * (including its `wengines` array) behaves exactly as before; entries only
 * ever land in memory.
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

  override saveStorageEntry(): void {
    // Catalog is static and rebuilt on every load; never persist it.
  }
  override removeStorageEntry(): void {
    // Nothing is ever persisted, so there is nothing to remove.
  }
  override exportZOOD(): void {
    // Catalog is static and rebuilt on every load; keep it out of exports.
  }
}

export const initialWengine = (key: WengineKey): ICachedWengine => ({
  id: key,
  key,
  level: 60,
  modification: 5,
  phase: 1,
})
