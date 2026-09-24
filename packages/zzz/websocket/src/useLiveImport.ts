import { createContext, useContext } from 'react'
import type { ImportResult } from '@zenless-optimizer/zzz/db'

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

// Provided by `LiveImportProvider`, which is mounted once at the app root so
// the connection outlives page navigation.
export const LiveImportContext = createContext<LiveImportState | undefined>(
  undefined
)

// Live database sync over WebSocket.
//
// The capturer (zzz_packet_capture) broadcasts a full ZOD snapshot on every
// inventory change. Each snapshot is imported with replace semantics
// (keepNotInImport = false), so dismantled discs vanish from the database, and
// duplicate detection stays on (ignoreDups = false). Categories the capturer
// has no data for are null in the ZOD and are left untouched.
export function useLiveImport(): LiveImportState {
  const ctx = useContext(LiveImportContext)
  if (!ctx)
    throw new Error('useLiveImport must be used within LiveImportProvider')
  return ctx
}
