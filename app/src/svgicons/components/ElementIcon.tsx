import type { SvgIconProps } from '@zenless-optimizer/common/svgicons'
import type { AttributeKey } from '../../consts'

const elementUrls: Record<string, string> = {
  fire: 'https://static.nanoka.cc/assets/zzz/IconFire.webp',
  ice: 'https://static.nanoka.cc/assets/zzz/IconIce.webp',
  electric: 'https://static.nanoka.cc/assets/zzz/IconElectric.webp',
  frost: 'https://static.nanoka.cc/assets/zzz/IconFrost.webp',
  physical: 'https://static.nanoka.cc/assets/zzz/IconPhysical.webp',
  ether: 'https://static.nanoka.cc/assets/zzz/IconEther.webp',
  wind: 'https://static.nanoka.cc/assets/zzz/IconWind.webp',
  lumiflux:
    'https://img.gachabase.net/conv/zzz/assets/1ed527ad8b2d3f7015071c429a92c3ae.png?q=50&sig=8d0f242d679ee55316987d290f487b31c062b346a9c65a348eb2110f6177de1c',
}

export function ElementIcon({
  ele,
  iconProps = {},
}: {
  ele: AttributeKey | 'frost'
  iconProps?: SvgIconProps
}) {
  const url = elementUrls[ele]
  if (!url) return null

  const { fontSize, style } = iconProps as Record<string, unknown>
  const cssStyle = (style ?? {}) as React.CSSProperties
  // For SVGs, fontSize controls intrinsic size; for <img>, map to width/height.
  // 'inherit' means "inherit parent font-size" in SVG context → equivalent to 1em.
  const fs = (fontSize as string | undefined) ?? cssStyle.fontSize
  const imgSize =
    cssStyle.width ?? cssStyle.height ?? (fs && fs !== 'inherit' ? fs : '1em')

  return (
    <img
      src={url}
      alt={ele}
      style={{
        width: imgSize,
        height: imgSize,
        ...cssStyle,
      }}
    />
  )
}
