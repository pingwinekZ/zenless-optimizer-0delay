import { SandboxStorage } from '@zenless-optimizer/common/database'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImportResult } from '../db'
import { ZzzDatabase } from '../db'
import { useDatabaseContext } from '../db-ui'

export const LIVE_IMPORT_URL = 'ws://127.0.0.1:23313/ws'

export type LiveImportStatus = 'disabled' | 'connecting' | 'connected'

export type LiveImportSnapshot = {
  result: ImportResult
  dbTotal: number
}

export type LiveImportState = {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  status: LiveImportStatus
  lastImport: LiveImportSnapshot | undefined
  lastImportAt: number | undefined
}

// Live database sync over WebSocket.
//
// The capturer (zzz_packet_capture) broadcasts a full ZOD snapshot on every
// inventory change. Each snapshot is imported with replace semantics
// (keepNotInImport = false), so dismantled discs vanish from the database, and
// duplicate detection stays on (ignoreDups = false). Categories the capturer
// has no data for are null in the ZOD and are left untouched.
export function useLiveImport(): LiveImportState {
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
          importedDatabase.toExtraLocalDB()
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

  return {
    enabled,
    setEnabled: setEnabledPersisted,
    status,
    lastImport,
    lastImportAt,
  }
}
