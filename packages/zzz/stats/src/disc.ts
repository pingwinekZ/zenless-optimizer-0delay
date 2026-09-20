import type { DiscSetKey } from '../consts'
import { allStats } from './allStats'

export type DiscDatum = Record<string, never>

export function getDiscStat(dKey: DiscSetKey) {
  return allStats.disc[dKey]
}
