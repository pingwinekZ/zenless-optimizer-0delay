import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import chroma from 'chroma-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ShowcaseColorState = {
  portraitColorByCharKey: Partial<Record<CharacterKey, string>>
  portraitPaletteByCharKey: Partial<Record<CharacterKey, string[]>>
  setPortraitPalette: (
    charKey: CharacterKey,
    color: string | undefined,
    palette: string[]
  ) => void
}

function isValidHex(color: unknown): color is string {
  if (typeof color !== 'string' || !color) return false
  try {
    chroma(color)
    return true
  } catch {
    return false
  }
}

function sanitizeColorMap(map: unknown): Partial<Record<CharacterKey, string>> {
  if (!map || typeof map !== 'object') return {}
  const out: Partial<Record<CharacterKey, string>> = {}
  for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
    if (isValidHex(value)) out[key as CharacterKey] = value
  }
  return out
}

function sanitizePaletteMap(
  map: unknown
): Partial<Record<CharacterKey, string[]>> {
  if (!map || typeof map !== 'object') return {}
  const out: Partial<Record<CharacterKey, string[]>> = {}
  for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue
    const palette = value.filter(isValidHex)
    if (palette.length) out[key as CharacterKey] = palette
  }
  return out
}

export const useShowcaseColorStore = create<ShowcaseColorState>()(
  persist(
    (set) => ({
      portraitColorByCharKey: {},
      portraitPaletteByCharKey: {},
      setPortraitPalette: (charKey, color, palette) =>
        set((s) => ({
          portraitColorByCharKey:
            color != null && color !== s.portraitColorByCharKey[charKey]
              ? { ...s.portraitColorByCharKey, [charKey]: color }
              : s.portraitColorByCharKey,
          portraitPaletteByCharKey: (() => {
            const prev = s.portraitPaletteByCharKey[charKey]
            if (
              prev &&
              prev.length === palette.length &&
              prev.every((c, i) => c === palette[i])
            )
              return s.portraitPaletteByCharKey
            return { ...s.portraitPaletteByCharKey, [charKey]: palette }
          })(),
        })),
    }),
    {
      name: 'showcase-color-store-v1',
      partialize: (s) => ({
        portraitColorByCharKey: s.portraitColorByCharKey,
        portraitPaletteByCharKey: s.portraitPaletteByCharKey,
      }),
      merge: (persisted, current) => ({
        ...current,
        portraitColorByCharKey: sanitizeColorMap(
          (persisted as Partial<ShowcaseColorState>)?.portraitColorByCharKey
        ),
        portraitPaletteByCharKey: sanitizePaletteMap(
          (persisted as Partial<ShowcaseColorState>)?.portraitPaletteByCharKey
        ),
      }),
    }
  )
)
