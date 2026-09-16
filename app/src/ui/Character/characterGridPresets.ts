import type { CSSProperties } from 'react'
import type { CharacterGridDensity } from '../store'

export type CharacterGridPreset = {
  listWidth: number
  rowHeight: number
  rowGap: number
  padding: number
  innerGap: number
  portraitScale: number
  portraitX: number
  portraitY: number
  lcSize: number
  lcStripWidth: number
  frostFadeEnd: number
  frostMaskSolid: number
}

export const characterGridPresets: Record<
  CharacterGridDensity,
  CharacterGridPreset
> = {
  default: {
    listWidth: 300,
    rowHeight: 68,
    rowGap: 1,
    padding: 8,
    innerGap: 10,
    portraitScale: 66,
    portraitX: 40,
    portraitY: 30,
    lcSize: 52,
    lcStripWidth: 54,
    frostFadeEnd: 27,
    frostMaskSolid: 77,
  },
  compact: {
    listWidth: 300,
    rowHeight: 48,
    rowGap: 0,
    padding: 8,
    innerGap: 8,
    portraitScale: 50,
    portraitX: 40,
    portraitY: 32,
    lcSize: 48,
    lcStripWidth: 52,
    frostFadeEnd: 35,
    frostMaskSolid: 67,
  },
}

function presetToCssVars(preset: CharacterGridPreset): CSSProperties {
  return {
    '--cr-list-width': `${preset.listWidth}px`,
    '--cr-row-height': `${preset.rowHeight}px`,
    '--cr-row-gap': `${preset.rowGap}px`,
    '--cr-padding': `${preset.padding}px`,
    '--cr-gap': `${preset.innerGap}px`,
    '--cr-portrait-scale': `${preset.portraitScale}%`,
    '--cr-portrait-x': `${preset.portraitX}%`,
    '--cr-portrait-y': `${preset.portraitY}%`,
    '--cr-lc-size': `${preset.lcSize}px`,
    '--cr-lc-strip-width': `${preset.lcStripWidth}px`,
    '--cr-frost-fade-end': `${preset.frostFadeEnd}%`,
    '--cr-frost-mask-solid': `${preset.frostMaskSolid}%`,
  } as CSSProperties
}

export const precomputedCssVars: Record<CharacterGridDensity, CSSProperties> = {
  default: presetToCssVars(characterGridPresets.default),
  compact: presetToCssVars(characterGridPresets.compact),
}
