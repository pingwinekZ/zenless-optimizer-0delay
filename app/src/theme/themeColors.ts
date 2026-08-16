import { type MantineColorsTuple } from '@mantine/core'
import chroma from 'chroma-js'

const DARK_LIGHTNESS_OFFSETS = [
  0.7, 0.6, 0.5, 0.4, 0.26, 0.12, 0.1, 0, -0.02, -0.04,
]

const PRIMARY_LIGHTNESS = [
  0.94, 0.86, 0.76, 0.66, 0.56, 0, 0.4, 0.32, 0.24, 0.16,
]

const SURFACE_HUE_OFFSET = 6.6
const SURFACE_SATURATION = 0.407
const SURFACE_BASE_LIGHTNESS = 0.159

const LAYER_OFFSETS = [0, 0.04, 0.1, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8]

export function deriveDarkPalette(seedHue: number): MantineColorsTuple {
  const baseBg = chroma.hsl(
    seedHue + SURFACE_HUE_OFFSET,
    SURFACE_SATURATION,
    SURFACE_BASE_LIGHTNESS
  )
  const baseL = baseBg.get('hsl.l')
  return DARK_LIGHTNESS_OFFSETS.map((offset) =>
    chroma(baseBg)
      .set('hsl.l', baseL + offset)
      .hex()
  ) as unknown as MantineColorsTuple
}

export function derivePrimaryPalette(seed: string): MantineColorsTuple {
  const [h, s, l] = chroma(seed).hsl()
  const seedL = Math.min(l, 0.55)
  const lightness = [...PRIMARY_LIGHTNESS]
  lightness[5] = seedL
  return lightness.map((pl) =>
    chroma.hsl(h, s, pl).hex()
  ) as unknown as MantineColorsTuple
}

export type CustomLayers = Record<`layer${number}`, string>

export function deriveCustomLayers(seedHue: number): CustomLayers {
  const baseBg = chroma.hsl(
    seedHue + SURFACE_HUE_OFFSET,
    SURFACE_SATURATION,
    SURFACE_BASE_LIGHTNESS
  )
  const baseL = baseBg.get('hsl.l')
  const layers: CustomLayers = {}
  for (let i = 0; i < LAYER_OFFSETS.length; i++) {
    layers[`layer${i}`] = chroma(baseBg)
      .set('hsl.l', baseL + LAYER_OFFSETS[i])
      .hex()
  }
  return layers
}
