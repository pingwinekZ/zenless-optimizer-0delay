import { characterAsset } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacterTabStore } from '@zenless-optimizer/zzz/ui'
import { useEffect, useMemo } from 'react'
import { extractPaletteInWorker } from './colorExtractionService'
import { DEFAULT_CONFIG } from './colorPipelineConfig'
import { pickBestSeed } from './colorUtils'
import { oklchCharacterListColor } from './colorUtilsOklch'
import { resolveShowcaseColor, ShowcaseColorMode } from './showcaseColorService'
import { useShowcaseColorStore } from './showcaseColorStore'

/**
 * Resolves a character's row background color from the same pipeline the
 * character panel uses: per-character preferences (Custom color / mode) via
 * `resolveShowcaseColor`, rendered through the list background ramp so the
 * rows stay readable in the list. Returns `undefined` when `characterKey` is
 * empty (no active drag row).
 *
 * The portrait-extracted seed (Auto mode) is normally produced only by the
 * focused character's preview, so on a fresh page load every row would fall
 * back to its attribute color until selected. Each row therefore populates
 * the shared color store itself; the worker caches per URL and `pickBestSeed`
 * is deterministic, so results are identical to the preview's extraction.
 */
export function useShowcaseRowColor(
  characterKey: CharacterKey | ''
): string | undefined {
  const preferences = useCharacterTabStore((s) =>
    characterKey ? s.showcasePreferences[characterKey] : undefined
  )
  const portraitExtractedColor = useShowcaseColorStore((s) =>
    characterKey ? s.portraitColorByCharKey[characterKey] : undefined
  )

  useEffect(() => {
    if (!characterKey) return
    if (useShowcaseColorStore.getState().portraitColorByCharKey[characterKey])
      return
    let aborted = false
    void (async () => {
      const palette = await extractPaletteInWorker(
        characterAsset(characterKey, 'full')
      )
      if (aborted || !palette) return
      const color = pickBestSeed(palette)
      useShowcaseColorStore
        .getState()
        .setPortraitPalette(characterKey, color, palette.palette)
    })()
    return () => {
      aborted = true
    }
  }, [characterKey])

  const seedColor = useMemo(() => {
    if (!characterKey) return undefined
    return resolveShowcaseColor(
      characterKey,
      ShowcaseColorMode.AUTO,
      preferences as Parameters<typeof resolveShowcaseColor>[2],
      portraitExtractedColor
    ).seedColor
  }, [characterKey, preferences, portraitExtractedColor])

  if (!seedColor) return undefined
  return oklchCharacterListColor(seedColor, true, DEFAULT_CONFIG)
}
