import { create } from 'zustand'
import type { CharacterKey } from '../../consts'

type ShowcaseColorState = {
  portraitColorByCharKey: Partial<Record<CharacterKey, string>>
  portraitPaletteByCharKey: Partial<Record<CharacterKey, string[]>>
  setPortraitPalette: (
    charKey: CharacterKey,
    color: string | undefined,
    palette: string[]
  ) => void
}

export const useShowcaseColorStore = create<ShowcaseColorState>((set) => ({
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
}))
