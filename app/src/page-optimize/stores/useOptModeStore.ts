import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * The optimizer's mutually-exclusive disc modes: theoretical-max and
 * potentially-best. Persisted per character because the result grid depends
 * on them — theoretical rows reference fake `recipe_*` discs and
 * potentially-best rows are scored against boosted discs — so losing the
 * toggles on a page switch or refresh would re-render the persisted results
 * differently from how the run produced them. Mutual exclusion is enforced
 * here (the two modes used to be paired local `useState`s in the optimizer).
 */
export type OptDiscMode = {
  theoretical: boolean
  potential: boolean
}

interface OptModeState {
  modes: Partial<Record<CharacterKey, OptDiscMode>>
  setTheoretical: (characterKey: CharacterKey, value: boolean) => void
  setPotential: (characterKey: CharacterKey, value: boolean) => void
}

function toMode(raw: unknown): OptDiscMode | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const entry = raw as Record<string, unknown>
  return {
    theoretical: entry.theoretical === true,
    potential: entry.potential === true,
  }
}

/** Coerce anything found in storage to well-typed modes, dropping junk. */
function sanitizeModes(raw: unknown): OptModeState['modes'] {
  const modes: OptModeState['modes'] = {}
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return modes
  for (const [key, value] of Object.entries(raw)) {
    const mode = toMode(value)
    if (mode) modes[key as CharacterKey] = mode
  }
  return modes
}

export const useOptModeStore = create<OptModeState>()(
  persist(
    (set) => ({
      modes: {},
      setTheoretical: (characterKey, theoretical) =>
        set((state) => ({
          modes: {
            ...state.modes,
            [characterKey]: {
              theoretical,
              potential: theoretical
                ? false
                : (state.modes[characterKey]?.potential ?? false),
            },
          },
        })),
      setPotential: (characterKey, potential) =>
        set((state) => ({
          modes: {
            ...state.modes,
            [characterKey]: {
              theoretical: potential
                ? false
                : (state.modes[characterKey]?.theoretical ?? false),
              potential,
            },
          },
        })),
    }),
    {
      name: 'opt-mode-store-v1',
      merge: (persisted, current) => ({
        ...current,
        modes: sanitizeModes(
          (persisted as Partial<OptModeState> | undefined)?.modes
        ),
      }),
    }
  )
)
