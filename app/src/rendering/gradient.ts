import chroma from 'chroma-js'

/**
 * Shared grid cell gradients, ported from hsr-optimizer's
 * `lib/rendering/gradient.ts`.
 *
 * Two different scales are in play:
 * - the Optimizer grid colors stat columns on a fixed red -> neutral -> green
 *   scale, so the meaning of a shade doesn't shift when the theme changes;
 * - the Discs grid colors score columns on a scale derived from the active
 *   theme (`setTheme`), so it follows the seed color like the rest of the UI.
 */

const GRADIENT_BUCKETS = 201 // 0-200 inclusive

// Optimizer stat columns: dark red (low) through neutral to green (high)
const optimizerGridGradient = chroma
  .scale(['#5A1A06', '#343127', '#38821F'])
  .domain([0, 0.35, 1])

const NEUTRAL_OPTIMIZER_STYLE = {
  '--cell-bg': optimizerGridGradient(0.5).hex(),
} as const

// Overwritten on page load by `Gradient.setTheme()` in App.tsx
let discGridGradient = chroma.scale(['#343127', '#38821F'])

let optimizerGradientCache: Array<{ '--cell-bg': string } | undefined> =
  Array.from({ length: GRADIENT_BUCKETS })
let discGradientCache: Array<{ '--cell-bg': string } | undefined> = Array.from({
  length: GRADIENT_BUCKETS,
})

export type CellGradientStyle = { '--cell-bg': string }

/**
 * The `--cell-bg` custom property is consumed by `.ag-cell` in
 * ag-grid-overrides.css so row hover/selection tints can composite over it.
 */
function bucketedStyle(
  clamped: number,
  gradient: chroma.Scale,
  cache: Array<CellGradientStyle | undefined>
): CellGradientStyle {
  // Quantize to ~200 buckets to maximize cache hits
  const key = Math.round(clamped * 200)
  const cached = cache[key]
  if (cached) return cached

  const style: CellGradientStyle = { '--cell-bg': gradient(clamped).hex() }
  cache[key] = style
  return style
}

function normalize(value: number, min: number, max: number): number {
  const range = max === min ? 0.5 : (value - min) / (max - min)
  return Math.min(Math.max(range, 0), 1)
}

export const Gradient = {
  getColor: (decimal: number, gradient: chroma.Scale) => {
    return gradient(decimal).hex()
  },

  clearOptimizerGradientCache() {
    optimizerGradientCache = Array.from({ length: GRADIENT_BUCKETS })
  },

  /** Optimizer stat cell — fixed scale, normalized within the column. */
  getOptimizerCellStyle(
    value: number | null | undefined,
    min: number | null | undefined,
    max: number | null | undefined
  ): CellGradientStyle | undefined {
    if (value == null) return undefined
    if (min == null || max == null) return NEUTRAL_OPTIMIZER_STYLE
    return bucketedStyle(
      normalize(value, min, max),
      optimizerGridGradient,
      optimizerGradientCache
    )
  },

  /** Discs score cell — theme-derived scale, normalized within the column. */
  getDiscCellStyle(
    value: number | null | undefined,
    min: number | null | undefined,
    max: number | null | undefined
  ): CellGradientStyle | undefined {
    if (value == null) return undefined
    if (min == null || max == null) return undefined
    return bucketedStyle(
      normalize(value, min, max),
      discGridGradient,
      discGradientCache
    )
  },

  /** Rebuilds the theme-derived scale and drops the caches that depend on it. */
  setTheme(darkBg: string, primaryLight: string) {
    discGridGradient = chroma.scale([darkBg, primaryLight])
    discGradientCache = Array.from({ length: GRADIENT_BUCKETS })
    optimizerGradientCache = Array.from({ length: GRADIENT_BUCKETS })
  },
}
