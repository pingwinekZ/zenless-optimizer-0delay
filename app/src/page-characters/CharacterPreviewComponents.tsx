import type { CSSProperties } from 'react'
import { withAlpha } from './color/colorUtils'

export enum ShowcaseSource {
  CHARACTER_TAB,
  SHOWCASE_TAB,
  BUILDS_MODAL,
}

const showcaseShadowDefault = 'none'
const showcaseShadowInsetDefault = ''

// Use CSS custom properties so the debug slider panel can override these
export const showcaseShadow = `var(--showcase-shadow, ${showcaseShadowDefault})`
export const showcaseShadowInsetAddition = `var(--showcase-shadow-inset, ${showcaseShadowInsetDefault})`
export const showcaseTransition = 'background-color 0.35s, border-color 0.25s'
export const showcaseOutlineLight = 'rgba(255, 255, 255, 0.20) solid 1px'
export const showcaseButtonStyle: CSSProperties = {
  flex: 'auto',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  visibility: 'hidden',
}

/**
 * Character-tinted wash behind the card, mirroring the role of HSR's
 * ShowcaseBackgroundBlur. HSR blurs the full-bleed portrait painting, but ZZZ
 * portrait art is a transparent-background cutout, so a portrait blur would
 * just be black — instead the wash is built from the extracted seed color and
 * the palette-derived card background (both character-specific, like HSR's
 * seed + card-bg pipeline).
 */
export function ShowcaseBackgroundBlur({
  seedColor,
  cardBgColor,
  cardBgAlpha,
}: {
  seedColor: string
  cardBgColor: string
  cardBgAlpha: number
}) {
  return (
    <>
      <div
        data-portrait-bg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
          background: [
            `radial-gradient(130% 90% at 50% 0%, ${withAlpha(cardBgColor, 0.85)}, transparent 70%)`,
            `radial-gradient(120% 120% at 50% 110%, ${withAlpha(seedColor, 0.35)}, transparent 60%)`,
            'var(--layer-inset)',
          ].join(','),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: seedColor,
          mixBlendMode: 'soft-light',
          opacity: cardBgAlpha,
        }}
      />
    </>
  )
}
