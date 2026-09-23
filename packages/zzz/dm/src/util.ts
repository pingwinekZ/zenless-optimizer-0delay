import { existsSync, readFileSync } from 'fs'
import { NANOKA_PATH } from './consts'

export function readNanokaJSON(path: string) {
  const fullPath = `${NANOKA_PATH}/${path}`
  if (!existsSync(fullPath)) throw `File not found :${fullPath}`
  return readFileSync(fullPath).toString()
}
