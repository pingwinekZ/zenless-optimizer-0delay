import { create } from 'zustand'
import type { DynamicRunMeta, DynamicScoreEntry } from './computeDynamicScores'

type DynamicDiscScoreState = {
  /** Keyed by `${characterKey}:${discId}`. */
  scores: Record<string, DynamicScoreEntry>
  /** Latest two-phase run summary per character. */
  runMeta: Record<string, DynamicRunMeta>
  setDynamicScores: (
    characterKey: string,
    entries: Record<string, DynamicScoreEntry>,
    meta: DynamicRunMeta
  ) => void
  clearDynamicScores: (characterKey: string) => void
  getDynamicScore: (
    characterKey: string,
    discId: string | undefined
  ) => number | undefined
}

export function dynamicScoreKey(characterKey: string, discId: string): string {
  return `${characterKey}:${discId}`
}

export const useDynamicDiscScoreStore = create<DynamicDiscScoreState>(
  (set, get) => ({
    scores: {},
    runMeta: {},
    setDynamicScores: (characterKey, entries, meta) =>
      set((state) => {
        const scores = { ...state.scores }
        // Drop stale entries for this character before inserting the new run.
        for (const key of Object.keys(scores))
          if (key.startsWith(`${characterKey}:`)) delete scores[key]
        for (const [discId, entry] of Object.entries(entries))
          scores[dynamicScoreKey(characterKey, discId)] = entry
        return { scores, runMeta: { ...state.runMeta, [characterKey]: meta } }
      }),
    clearDynamicScores: (characterKey) =>
      set((state) => {
        const scores = { ...state.scores }
        for (const key of Object.keys(scores))
          if (key.startsWith(`${characterKey}:`)) delete scores[key]
        const runMeta = { ...state.runMeta }
        delete runMeta[characterKey]
        return { scores, runMeta }
      }),
    getDynamicScore: (characterKey, discId) => {
      if (!discId) return undefined
      return get().scores[dynamicScoreKey(characterKey, discId)]?.score
    },
  })
)
