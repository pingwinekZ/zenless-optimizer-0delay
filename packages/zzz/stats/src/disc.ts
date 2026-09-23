import type { DiscSetKey } from '@zenless-optimizer/zzz/consts'
import { allStats } from './allStats'

export type DiscDatum = Record<string, never>

export function getDiscStat(dKey: DiscSetKey) {
  return allStats.disc[dKey]
}
