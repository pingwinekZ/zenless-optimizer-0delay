/* eslint-disable no-restricted-globals */

export interface ColorWorkerRequest {
  id: number
  url: string
}

export interface ColorWorkerResponse {
  id: number
  result: ColorWorkerResult | null
  error?: string
}

export interface ColorWorkerResult {
  dominantHex: string
  paletteHex: string[]
}

const DOWNSAMPLE_SIZE = 100
const DEFAULT_FALLBACK = '#2241be'

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.round(Math.max(0, Math.min(255, c))))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  )
}

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function extractSimplePalette(imageData: ImageData): ColorWorkerResult {
  const data = imageData.data
  const len = data.length / 4

  const NUM_BINS = 12
  const bins: Map<number, { r: number; g: number; b: number; count: number }> =
    new Map()

  for (let i = 0; i < len; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const a = data[i * 4 + 3]
    if (a < 128) continue

    const sr = r / 255
    const sg = g / 255
    const sb = b / 255

    const luminance = 0.299 * sr + 0.587 * sg + 0.114 * sb
    if (luminance < 0.05 || luminance > 0.95) continue

    const max = Math.max(sr, sg, sb)
    const min = Math.min(sr, sg, sb)
    const delta = max - min
    if (delta < 0.02) continue

    let hue = 0
    if (delta > 0) {
      if (max === sr) hue = ((sg - sb) / delta + (sg < sb ? 6 : 0)) * 60
      else if (max === sg) hue = ((sb - sr) / delta + 2) * 60
      else hue = ((sr - sg) / delta + 4) * 60
    }

    const binIdx = Math.floor(hue / (360 / NUM_BINS)) % NUM_BINS
    const existing = bins.get(binIdx) ?? { r: 0, g: 0, b: 0, count: 0 }
    existing.r += r
    existing.g += g
    existing.b += b
    existing.count++
    bins.set(binIdx, existing)
  }

  if (bins.size === 0) {
    return { dominantHex: DEFAULT_FALLBACK, paletteHex: [DEFAULT_FALLBACK] }
  }

  const sorted = [...bins.entries()].sort((a, b) => b[1].count - a[1].count)

  const top = sorted[0][1]
  const dominantHex = rgbToHex(
    top.r / top.count,
    top.g / top.count,
    top.b / top.count
  )

  const paletteHex = sorted
    .slice(0, 6)
    .map(([, bin]) =>
      rgbToHex(bin.r / bin.count, bin.g / bin.count, bin.b / bin.count)
    )
    .filter((hex) => hex !== dominantHex && hexLuminance(hex) >= 0.12)

  return {
    dominantHex,
    paletteHex: paletteHex.length ? paletteHex : [dominantHex],
  }
}

async function fetchAndDownsample(url: string): Promise<ImageData> {
  const response = await fetch(url)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob, {
    resizeWidth: DOWNSAMPLE_SIZE,
    resizeHeight: DOWNSAMPLE_SIZE,
    resizeQuality: 'low',
  })
  const canvas = new OffscreenCanvas(DOWNSAMPLE_SIZE, DOWNSAMPLE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, DOWNSAMPLE_SIZE, DOWNSAMPLE_SIZE)
}

self.onmessage = async (e: MessageEvent<ColorWorkerRequest>) => {
  const req = e.data
  try {
    const imageData = await fetchAndDownsample(req.url)
    const result = extractSimplePalette(imageData)
    const response: ColorWorkerResponse = { id: req.id, result }
    self.postMessage(response)
  } catch (err) {
    const response: ColorWorkerResponse = {
      id: req.id,
      result: null,
      error: err instanceof Error ? err.message : 'Unknown worker error',
    }
    self.postMessage(response)
  }
}
