import chroma from 'chroma-js'
import type { AttributeKey } from '../../consts'
import type { PaletteResponse } from './colorExtractionService'

export const attributeColors: Record<AttributeKey, string> = {
  fire: '#d9301e',
  ice: '#04c4d9',
  electric: '#0075d9',
  physical: '#b0b0b0',
  ether: '#a64dff',
  wind: '#2ecc71',
  lumiflux: '#FFA9DD',
}

export function showcaseBackgroundColor(color: string) {
  return chroma(color).desaturate(0.2).luminance(0.02).css()
}

export function withAlpha(cssColor: string, alpha: number): string {
  return chroma(cssColor).alpha(alpha).css()
}

export function getAttributeColor(attribute: AttributeKey): string {
  return attributeColors[attribute] ?? '#647bb0'
}

const DEFAULT_FALLBACK = '#2241be'

export function pickBestSeed(palette: PaletteResponse): string {
  const all = [palette.dominant, ...palette.palette].filter((c) => {
    if (c === DEFAULT_FALLBACK) return false
    const [l, ch] = chroma(c).oklch()
    if (l > 0.9 && ch < 0.03) return false
    if (l < 0.05) return false
    return true
  })

  if (!all.length) return DEFAULT_FALLBACK

  let best = all[0]
  let bestScore = -Infinity

  for (const color of all) {
    const [l, c, h] = chroma(color).oklch()
    let score = c

    if (!Number.isNaN(h)) {
      if (h >= 10 && h <= 80 && c < 0.22) score *= 0.1
      if (h >= 40 && h <= 70 && c > 0.02 && c < 0.12) score *= 0.1
    }

    if (!Number.isNaN(h) && h >= 180 && h <= 310) score *= 1.5

    const lDist = Math.abs(l - 0.35)
    score *= Math.max(0.2, 1 - lDist * 2)

    if (score > bestScore) {
      bestScore = score
      best = color
    }
  }

  return best
}
