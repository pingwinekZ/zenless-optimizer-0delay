import { Box } from '@mantine/core'
import { OuterShadowRingWrapper } from '../CharacterPreviewComponents'
import styles from './ShowcasePortrait.module.css'

export function ShowcasePortrait({
  portraitUrl,
  parentW,
  parentH,
}: {
  portraitUrl: string
  parentW: number
  parentH: number
}) {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1,
        width: parentW,
        flexShrink: 0,
      }}
    >
      <OuterShadowRingWrapper>
        <Box className={styles.portraitContainer} style={{ height: parentH }}>
          <Box
            component="img"
            src={portraitUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
        </Box>
      </OuterShadowRingWrapper>
    </Box>
  )
}
