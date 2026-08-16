import { create } from 'zustand'
import type { CharacterKey, DiscSlotKey } from '../../consts'
import { allDiscSlotKeys } from '../../consts'

export type CharacterTabFilters = {
  name: string
  element: string[]
  specialty: string[]
  rarity: string[]
}

export type CharacterGridDensity = 'default' | 'compact'

export interface ShowcasePreferences {
  color?: string
  colorMode?: string
}

type CharacterTabState = {
  focusCharacter: CharacterKey | null
  filters: CharacterTabFilters
  density: CharacterGridDensity
  setFocusCharacter: (key: CharacterKey | null) => void
  clearFocusCharacter: () => void
  setDensity: (density: CharacterGridDensity) => void
  setNameFilter: (name: string) => void
  setElementFilter: (element: string[]) => void
  setSpecialtyFilter: (specialty: string[]) => void
  setRarityFilter: (rarity: string[]) => void
  showcasePreferences: Partial<Record<CharacterKey, ShowcasePreferences>>
  setShowcasePreference: (key: CharacterKey, prefs: ShowcasePreferences) => void
  showcaseDarkMode: boolean
  setShowcaseDarkMode: (darkMode: boolean) => void
  showcasePreset: 'shine' | 'natural'
  setShowcasePreset: (preset: 'shine' | 'natural') => void
}

export function countEquippedDiscs(
  equippedDiscs: Record<DiscSlotKey, string | undefined>
): number {
  return allDiscSlotKeys.filter((slot) => !!equippedDiscs[slot]).length
}

export function equipDotColor(
  equippedDiscs: Record<DiscSlotKey, string | undefined>
): 'red' | 'gold' | null {
  const count = countEquippedDiscs(equippedDiscs)
  if (count === 6) return null
  if (count === 0) return 'red'
  return 'gold'
}

export const useCharacterTabStore = create<CharacterTabState>((set) => ({
  focusCharacter: null,
  density: 'default',
  filters: {
    name: '',
    element: [],
    specialty: [],
    rarity: [],
  },
  setFocusCharacter: (key) => set({ focusCharacter: key }),
  clearFocusCharacter: () => set({ focusCharacter: null }),
  setDensity: (density) => set({ density }),
  setNameFilter: (name) => set((s) => ({ filters: { ...s.filters, name } })),
  setElementFilter: (element) =>
    set((s) => ({ filters: { ...s.filters, element } })),
  setSpecialtyFilter: (specialty) =>
    set((s) => ({ filters: { ...s.filters, specialty } })),
  setRarityFilter: (rarity) =>
    set((s) => ({ filters: { ...s.filters, rarity } })),
  showcasePreferences: {},
  setShowcasePreference: (key, prefs) =>
    set((s) => ({
      showcasePreferences: {
        ...s.showcasePreferences,
        [key]: { ...s.showcasePreferences[key], ...prefs },
      },
    })),
  showcaseDarkMode: true,
  setShowcaseDarkMode: (showcaseDarkMode) => set({ showcaseDarkMode }),
  showcasePreset: 'shine',
  setShowcasePreset: (showcasePreset) => set({ showcasePreset }),
}))
