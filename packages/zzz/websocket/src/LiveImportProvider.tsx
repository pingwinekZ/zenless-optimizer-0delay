import { SandboxStorage } from '@zenless-optimizer/common/database'
import { ZzzDatabase } from '@zenless-optimizer/zzz/db'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LIVE_IMPORT_URL,
  LiveImportContext,
  type LiveImportSnapshot,
  type LiveImportStatus,
} from './useLiveImport'

// Owns the live-import WebSocket connection.
//
// Mounted once at the app root (inside `DatabaseProvider`), so navigating
// between pages never unmounts it and the connection stays up. UI such as
// `LiveImportCard` only reads state via `useLiveImport()` and never owns a
// socket of its own.
export function LiveImportProvider({ children }: { children: ReactNode }) {
  const { databases, database, setDatabase } = useDatabaseContext()
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('zzz_liveImport') === '1'
  )
  const [status, setStatus] = useState<LiveImportStatus>('disabled')
  const [lastImport, setLastImport] = useState<LiveImportSnapshot>()
  const [lastImportAt, setLastImportAt] = useState<number>()

  const databaseRef = useRef(database)
  databaseRef.current = database
  const databasesRef = useRef(databases)
  databasesRef.current = databases
  const setDatabaseRef = useRef(setDatabase)
  setDatabaseRef.current = setDatabase

  useEffect(() => {
    localStorage.setItem('zzz_liveImport', enabled ? '1' : '0')
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setStatus('disabled')
      return
    }
    let ws: WebSocket | undefined
    let retryTimer: number | undefined
    let disposed = false

    const connect = () => {
      if (disposed) return
      setStatus('connecting')
      try {
        ws = new WebSocket(LIVE_IMPORT_URL)
      } catch {
        retryTimer = window.setTimeout(connect, 2000)
        return
      }
      ws.onopen = () => {
        if (!disposed) setStatus('connected')
      }
      ws.onclose = () => {
        if (disposed) return
        setStatus('connecting')
        retryTimer = window.setTimeout(connect, 2000)
      }
      ws.onmessage = (ev) => {
        const current = databaseRef.current
        const index = databasesRef.current.findIndex((d) => d === current)
        if (index < 0) return
        try {
          const zood = JSON.parse(ev.data as string)
          if (
            typeof zood !== 'object' ||
            (zood.format !== 'ZOD' && zood.format !== 'ZOOD')
          )
            return
          const copyStorage = new SandboxStorage(undefined, 'zzz')
          copyStorage.copyFrom(current.storage)
          const importedDatabase = new ZzzDatabase(
            (index + 1) as 1 | 2 | 3 | 4,
            copyStorage
          )
          const result = importedDatabase.importZOOD(zood, false, false)
          importedDatabase.swapStorage(current)
          setDatabaseRef.current(index, importedDatabase)
          // Blocked when the snapshot would empty the database (e.g. a failed
          // capture), which leaves the last good inventory in place.
          importedDatabase.persistSlot()
          setLastImport({
            result,
            dbTotal: importedDatabase.discs.values.length,
          })
          setLastImportAt(Date.now())
        } catch (e) {
          console.error('Failed to process live import message', e)
        }
      }
    }
    connect()

    return () => {
      disposed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      ws?.close()
    }
  }, [enabled])

  const setEnabledPersisted = useCallback(
    (value: boolean) => setEnabled(value),
    []
  )

  const value = useMemo(
    () => ({
      enabled,
      setEnabled: setEnabledPersisted,
      status,
      lastImport,
      lastImportAt,
    }),
    [enabled, setEnabledPersisted, status, lastImport, lastImportAt]
  )

  return (
    <LiveImportContext.Provider value={value}>
      {children}
    </LiveImportContext.Provider>
  )
}
