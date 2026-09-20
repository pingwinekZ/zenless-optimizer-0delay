import type { CharacterKey, DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

const COLOR_MODES = ['AUTO', 'CUSTOM', 'STANDARD'] as const

function sanitizeShowcasePreferences(
  prefs: unknown
): Partial<Record<CharacterKey, ShowcasePreferences>> {
  if (!prefs || typeof prefs !== 'object') return {}
  const out: Partial<Record<CharacterKey, ShowcasePreferences>> = {}
  for (const [key, value] of Object.entries(prefs)) {
    if (!value || typeof value !== 'object') continue
    const { color, colorMode } = value as {
      color?: unknown
      colorMode?: unknown
    }
    const entry: ShowcasePreferences = {}
    if (typeof color === 'string' && color) entry.color = color
    if (
      typeof colorMode === 'string' &&
      (COLOR_MODES as readonly string[]).includes(colorMode)
    )
      entry.colorMode = colorMode
    if (entry.color || entry.colorMode) out[key as CharacterKey] = entry
  }
  return out
}

export const useCharacterTabStore = create<CharacterTabState>()(
  persist(
    (set) => ({
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
      setNameFilter: (name) =>
        set((s) => ({ filters: { ...s.filters, name } })),
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
    }),
    {
      name: 'character-tab-store-v1',
      // Only the showcase customization state survives refreshes; focus,
      // filters and density stay session-only.
      partialize: (s) => ({
        showcasePreferences: s.showcasePreferences,
        showcaseDarkMode: s.showcaseDarkMode,
        showcasePreset: s.showcasePreset,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<{
          showcasePreferences: unknown
          showcaseDarkMode: unknown
          showcasePreset: unknown
        }>
        return {
          ...current,
          showcasePreferences: sanitizeShowcasePreferences(
            p?.showcasePreferences
          ),
          showcaseDarkMode:
            typeof p?.showcaseDarkMode === 'boolean'
              ? p.showcaseDarkMode
              : current.showcaseDarkMode,
          showcasePreset:
            p?.showcasePreset === 'natural' || p?.showcasePreset === 'shine'
              ? p.showcasePreset
              : current.showcasePreset,
        }
      },
    }
  )
)
