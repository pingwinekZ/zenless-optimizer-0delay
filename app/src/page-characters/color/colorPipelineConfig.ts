export interface CardColorConfig {
  targetL: number
  lInputScale: number
  minL: number
  maxL: number
  chromaScale: number
  minC: number
  maxC: number
  alpha: number
}

export interface DarkModeConfig {
  lOffset: number
  cScale: number
  brightnessOffset: number
}

export interface ColorPipelineConfig {
  cardBg: CardColorConfig
  cardBorder: CardColorConfig
  characterListBg: CardColorConfig
  darkMode: DarkModeConfig
}

export const DEFAULT_CONFIG: ColorPipelineConfig = {
  cardBg: {
    targetL: 0.45,
    lInputScale: 0.25,
    minL: 0.05,
    maxL: 0.47,
    chromaScale: 0.55,
    minC: 0.04,
    maxC: 0.08,
    alpha: 0.4,
  },
  cardBorder: {
    targetL: 0.58,
    lInputScale: 0.0,
    minL: 0.2,
    maxL: 0.7,
    chromaScale: 0.45,
    minC: 0.03,
    maxC: 0.08,
    alpha: 0.8,
  },
  characterListBg: {
    targetL: 0.48,
    lInputScale: 0.0,
    minL: 0.38,
    maxL: 0.62,
    chromaScale: 1.0,
    minC: 0.08,
    maxC: 0.1,
    alpha: 0.7,
  },
  darkMode: {
    lOffset: -0.05,
    cScale: 0.9,
    brightnessOffset: -0.05,
  },
}
