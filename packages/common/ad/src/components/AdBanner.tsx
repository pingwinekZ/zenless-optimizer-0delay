import { Box } from '@mantine/core'
import type { FunctionComponent } from 'react'
import type { AdProps } from '../type'
import { AdWrapper } from './AdWrapper'

/**
 * Banner ads that are usually put in the header/footer
 */
export function AdBanner({
  width = 0,
  dataAdSlot = '',
  Ad,
}: {
  dataAdSlot: string
  width: number
  Ad: FunctionComponent<AdProps>
}) {
  if (!width) return null

  return (
    <Box style={{ margin: 8 }}>
      <AdWrapper
        fullWidth
        dataAdSlot={dataAdSlot}
        style={{
          height: 90,
          minWidth: 300,
          // 20 to compensate for the margin of the outer Box
          maxWidth: Math.min(1000, width - 20),
          width: '100%',
        }}
        Ad={Ad}
      />
    </Box>
  )
}
