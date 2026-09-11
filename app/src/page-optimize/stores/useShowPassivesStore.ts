import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function isBool(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

interface ShowPassivesState {
  showCharPassives: boolean
  showWenginePassives: boolean
  setShowCharPassives: (v: boolean) => void
  setShowWenginePassives: (v: boolean) => void
}

export const useShowPassivesStore = create<ShowPassivesState>()(
  persist(
    (set) => ({
      showCharPassives: false,
      showWenginePassives: false,
      setShowCharPassives: (showCharPassives) => set({ showCharPassives }),
      setShowWenginePassives: (showWenginePassives) =>
        set({ showWenginePassives }),
    }),
    {
      name: 'show-passives-store-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<ShowPassivesState> | undefined
        return {
          ...current,
          showCharPassives: isBool(p?.showCharPassives)
            ? p.showCharPassives
            : current.showCharPassives,
          showWenginePassives: isBool(p?.showWenginePassives)
            ? p.showWenginePassives
            : current.showWenginePassives,
        }
      },
    }
  )
)
