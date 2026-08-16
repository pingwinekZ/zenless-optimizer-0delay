import { Box } from '@mantine/core'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import type { CardBackgroundColor } from '@zenless-optimizer/common/ui'
import { useRefSize } from '@zenless-optimizer/common/ui'
import type { FunctionComponent } from 'react'
import type { AdProps } from '../type'
import { AdWrapper } from './AdWrapper'

export function AdResponsive({
  dataAdSlot,
  bgt = 'normal',
  maxHeight = 350,
  Ad,
}: {
  dataAdSlot: string
  bgt?: CardBackgroundColor
  maxHeight?: number
  Ad: FunctionComponent<AdProps>
}) {
  const { width, height, ref } = useRefSize<HTMLDivElement>()
  const [show, _, onHide] = useBoolState(true)

  if (!show) return null
  return (
    <Box ref={ref} style={{ height: '100%', width: '100%', maxHeight }}>
      {width && (
        <AdWrapper
          bgt={bgt}
          onClose={(e) => {
            e.stopPropagation()
            onHide()
          }}
          dataAdSlot={dataAdSlot}
          style={{ width, height: Math.max(height, maxHeight) }}
          Ad={Ad}
        />
      )}
    </Box>
  )
}
