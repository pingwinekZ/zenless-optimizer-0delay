import { DBLocalStorage, SlotStorage } from '@zenless-optimizer/common/database'
import {
  isLegacyStorageKey,
  slotMigrationKey,
  slotStorageKey,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { DatabaseContext, type DatabaseContextObj } from '../context'
import { useDatabaseAutoSave } from './useDatabaseAutoSave'

function getValidDbIndex(): 1 | 2 | 3 | 4 {
  const parsed = parseInt(localStorage.getItem('zzz_dbIndex') || '1')
  return parsed >= 1 && parsed <= 4 ? (parsed as 1 | 2 | 3 | 4) : 1
}

/** Whether any pre-slot per-entry key is still in the storage */
function hasLegacyStorageData(storage: Storage): boolean {
  return Object.keys(storage).some(isLegacyStorageKey)
}

/**
 * Open one database slot.
 *
 * Every slot - the active one included - lives in a single compressed
 * localStorage key. Only an install that predates that format still has
 * per-entry keys, and those are migrated once: the entries are written to the
 * slot, read back to confirm, and only then deleted.
 */
export function openDatabaseSlot(
  index: 1 | 2 | 3 | 4,
  activeIndex: 1 | 2 | 3 | 4,
  storage: Storage = localStorage
): ZzzDatabase {
  const slotKey = slotStorageKey(index)
  // Only the active database can have per-entry keys: those were written by
  // the storage the active database held.
  const isActive = index === activeIndex
  const migrationDone = Boolean(storage.getItem(slotMigrationKey(index)))
  if (isActive && hasLegacyStorageData(storage)) {
    if (!migrationDone) {
      const database = new ZzzDatabase(
        index,
        new DBLocalStorage(storage, 'zzz')
      )
      // On failure the per-entry keys are kept, and the next load retries
      // instead of leaving the user with a half-written slot.
      database.adoptSlotStorage(SlotStorage.open(slotKey, storage, 'zzz'))
      return database
    }
    // Interrupted purge: the slot is authoritative now, so drop the leftovers.
    new DBLocalStorage(storage, 'zzz').removeForKeys(isLegacyStorageKey)
  }
  const database = new ZzzDatabase(
    index,
    SlotStorage.open(slotKey, storage, 'zzz')
  )
  // Nothing the constructor wrote is new: don't rewrite the slot on every load
  database.markSlotClean()
  return database
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const dbIndex = getValidDbIndex()
  const [databases, setDatabases] = useState(() =>
    ([1, 2, 3, 4] as const).map((index) => openDatabaseSlot(index, dbIndex))
  )
  // Slot writes are debounced instead of happening on every mutation
  useDatabaseAutoSave(databases)
  const setDatabase = useCallback(
    (index: number, db: ZzzDatabase) => {
      const dbs = [...databases]
      dbs[index] = db
      setDatabases(dbs)
    },
    [databases, setDatabases]
  )

  const database = databases[dbIndex - 1]
  const dbContextObj: DatabaseContextObj = useMemo(
    () => ({ databases, setDatabases, database, setDatabase }),
    [databases, setDatabases, database, setDatabase]
  )
  return (
    <DatabaseContext.Provider value={dbContextObj}>
      {children}
    </DatabaseContext.Provider>
  )
}
