import { Box } from '@mantine/core'
import type { CSSProperties } from 'react'
import { useEffect } from 'react'

export function AdSenseUnit({
  dataAdSlot,
  style: extraStyle = {},
  fullWidth = false,
}: {
  dataAdSlot: string
  style?: CSSProperties
  fullWidth?: boolean
}) {
  useEffect(() => {
    try {
      const w = window as any
      w.adsbygoogle = (window as any).adsbygoogle || []
      w.adsbygoogle.push({})
    } catch (e) {
      console.error(e)
    }
  }, [])

  return (
    <Box
      component="ins"
      className="adsbygoogle"
      style={{ display: 'block', margin: 'auto', ...extraStyle }}
      data-ad-client="ca-pub-2443965532085844"
      data-ad-slot={dataAdSlot}
      data-full-width-responsive={fullWidth ? 'true' : undefined}
    />
  )
}
