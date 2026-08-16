import type { CharacterKey } from '../../consts'
import { getCharStat } from '../../stats'
import { type ColorPipelineConfig } from './colorPipelineConfig'
import { getAttributeColor } from './colorUtils'
import {
  oklchCardBackgroundColor,
  oklchCardBorderColor,
} from './colorUtilsOklch'

export enum ShowcaseColorMode {
  AUTO = 'AUTO',
  CUSTOM = 'CUSTOM',
  STANDARD = 'STANDARD',
}

export interface ShowcasePreferences {
  color?: string
  colorMode?: ShowcaseColorMode
}

export interface ShowcaseTheme {
  cardBackgroundColor: string
  cardBorderColor: string
}

const STANDARD_COLOR = '#647bb0'

interface ResolvedShowcaseColor {
  effectiveColorMode: ShowcaseColorMode
  seedColor: string
}

export function resolveShowcaseColor(
  characterKey: CharacterKey,
  globalColorMode: ShowcaseColorMode,
  preferences: ShowcasePreferences | undefined,
  portraitExtractedColor: string | undefined
): ResolvedShowcaseColor {
  const savedColorMode = preferences?.colorMode
  let effectiveColorMode: ShowcaseColorMode
  if (globalColorMode === ShowcaseColorMode.STANDARD) {
    effectiveColorMode = ShowcaseColorMode.STANDARD
  } else if (!savedColorMode || savedColorMode === ShowcaseColorMode.STANDARD) {
    effectiveColorMode = ShowcaseColorMode.AUTO
  } else {
    effectiveColorMode = savedColorMode
  }

  const charStat = getCharStat(characterKey)
  const attributeColor = getAttributeColor(charStat.attribute)

  switch (effectiveColorMode) {
    case ShowcaseColorMode.STANDARD:
      return { effectiveColorMode, seedColor: STANDARD_COLOR }
    case ShowcaseColorMode.CUSTOM:
      return {
        effectiveColorMode,
        seedColor: preferences?.color ?? attributeColor,
      }
    case ShowcaseColorMode.AUTO:
    default:
      return {
        effectiveColorMode,
        seedColor: portraitExtractedColor ?? attributeColor,
      }
  }
}

export function resolveShowcaseTheme(
  seedColor: string,
  darkMode: boolean,
  config?: ColorPipelineConfig
): ShowcaseTheme {
  return {
    cardBackgroundColor: oklchCardBackgroundColor(seedColor, darkMode, config),
    cardBorderColor: oklchCardBorderColor(seedColor, darkMode, config),
  }
}
