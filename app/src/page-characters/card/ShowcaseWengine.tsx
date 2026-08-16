import { Box, Text } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { wengineAsset } from '../../assets'
import type { PhaseKey, WengineKey } from '../../consts'
import { WengineName } from '../../ui'
import { OuterShadowRingWrapper } from '../CharacterPreviewComponents'
import styles from './ShowcaseWengine.module.css'

export function ShowcaseWengine({
  wengineKey,
  phase,
  onClick,
}: {
  wengineKey: WengineKey | ''
  phase: PhaseKey
  onClick?: () => void
}) {
  return (
    <OuterShadowRingWrapper>
      <Box className={styles.wengineCard} onClick={onClick}>
        {wengineKey ? (
          <>
            <Box
              component="img"
              src={wengineAsset(wengineKey)}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <Box className={styles.wengineOverlay}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ImgIcon src={wengineAsset(wengineKey)} size={1.4} />
                <Text className={styles.wengineName} component="span">
                  <WengineName wKey={wengineKey} />
                </Text>
              </Box>
              <Text className={styles.wenginePhase}>P{phase}</Text>
            </Box>
          </>
        ) : (
          <Box
            className={styles.wengineOverlay}
            style={{
              justifyContent: 'center',
              minHeight: 44,
            }}
          >
            <Text size="sm" c="dimmed">
              No W-Engine
            </Text>
          </Box>
        )}
      </Box>
    </OuterShadowRingWrapper>
  )
}
