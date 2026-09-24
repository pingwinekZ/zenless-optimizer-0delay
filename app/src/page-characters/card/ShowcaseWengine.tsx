import { Box, Text } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { PhaseKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import { WengineName } from '@zenless-optimizer/zzz/ui'
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
    <Box className={styles.wengineCard} onClick={onClick}>
      {wengineKey ? (
        <Box className={styles.wengineBar}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ImgIcon src={wengineAsset(wengineKey)} size={2.8} />
            <Text className={styles.wengineName} component="span">
              <WengineName wKey={wengineKey} />
            </Text>
          </Box>
          <Text className={styles.wenginePhase}>P{phase}</Text>
        </Box>
      ) : (
        <Box
          className={styles.wengineBar}
          style={{
            justifyContent: 'center',
          }}
        >
          <Text size="sm" c="dimmed">
            No W-Engine
          </Text>
        </Box>
      )}
    </Box>
  )
}
