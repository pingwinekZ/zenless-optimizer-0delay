import type { ZzzDatabase } from '@zenless-optimizer/zzz/db'
import { useEffect } from 'react'

/**
 * How long the database has to sit still before its slot is written.
 *
 * Every mutation used to write straight to localStorage (one key per entry),
 * which made a live import or a bulk edit thousands of synchronous writes. Now
 * a slot is a single compressed key, so writes are batched instead: the data
 * lives in memory and lands on disk once the edits settle.
 */
const persistDebounceMs = 1000

/**
 * Persist database slots after their changes settle, plus immediately when the
 * tab is being hidden or unloaded (a debounce must never swallow the last edit,
 * and mobile browsers only fire `pagehide`/`visibilitychange`).
 */
export function useDatabaseAutoSave(databases: readonly ZzzDatabase[]) {
  useEffect(() => {
    /** Pending debounce per database */
    const timers = new Map<ZzzDatabase, ReturnType<typeof setTimeout>>()

    const persist = (database: ZzzDatabase) => {
      const timer = timers.get(database)
      if (timer !== undefined) {
        clearTimeout(timer)
        timers.delete(database)
      }
      if (!database.hasUnsavedSlotChanges) return
      database.persistSlot()
    }

    const schedule = (database: ZzzDatabase) => {
      if (timers.has(database)) return
      timers.set(
        database,
        setTimeout(() => {
          timers.delete(database)
          persist(database)
        }, persistDebounceMs)
      )
    }

    const persistAll = () => databases.forEach(persist)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistAll()
    }

    const unfollows = databases.flatMap((database) => [
      ...database.dataManagers.map((manager) =>
        manager.followAny(() => schedule(database))
      ),
      ...database.dataEntries.map((entry) =>
        entry.follow(() => schedule(database))
      ),
    ])

    window.addEventListener('pagehide', persistAll)
    window.addEventListener('beforeunload', persistAll)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      unfollows.forEach((unfollow) => unfollow())
      window.removeEventListener('pagehide', persistAll)
      window.removeEventListener('beforeunload', persistAll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      // Re-subscribing happens right after (e.g. a database was replaced), so
      // flush whatever is pending for the databases this effect watched.
      persistAll()
    }
  }, [databases])
}
