import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve from this file's location so the path stays correct regardless of
// the current working directory (e.g. `bun test` runs from app/)
const DM_PATH = dirname(fileURLToPath(import.meta.url))
export const PROJROOT_PATH = DM_PATH
export const NANOKA_PATH = `${PROJROOT_PATH}/NanokaData` as const
export const DM2D_PATH = `${PROJROOT_PATH}/assets` as const
