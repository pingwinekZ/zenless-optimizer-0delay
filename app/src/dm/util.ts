import { existsSync, readFileSync } from 'fs'
import { HAKUSHIN_PATH } from './consts'

export function readHakushinJSON(path: string) {
  const fullPath = `${HAKUSHIN_PATH}/${path}`
  if (!existsSync(fullPath)) throw `File not found :${fullPath}`
  return readFileSync(fullPath).toString()
}
