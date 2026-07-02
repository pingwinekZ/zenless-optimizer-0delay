import { Box, Divider, Flex, SimpleGrid, Text } from '@mantine/core'
import { CardThemed, ModalWrapper } from '@zenless-optimizer/common/ui'
import { wengineAsset } from '../../assets'
import { useWengine } from '../../db-ui'
import { getWengineStat, getWengineStats } from '../../stats'
import { StatDisplay } from '../Character'
import { WengineSubstatDisplay } from './WengineSubstatDisplay'

type WengineStatsEditorCardProps = {
  wengineId: string
  footer?: boolean
  onClose?: () => void
}
export function WengineEditor({
  wengineId: propWengineId,
  footer = false,
  onClose,
}: WengineStatsEditorCardProps) {
  const wengine = useWengine(propWengineId)
  const { key, level = 0, phase = 1, modification = 0 } = wengine ?? {}
  const wengineStat = key ? getWengineStat(key) : undefined
  const wengineStats = key
    ? getWengineStats(key, level, phase, modification)
    : undefined

  const img = key ? wengineAsset(key) : ''
  return (
    <ModalWrapper
      opened={!!propWengineId}
      onClose={onClose ?? (() => {})}
      containerProps={{ maxWidth: 'md' }}
    >
      <CardThemed bgt="light">
        <Box p="sm">
          {wengineStat && (
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Box>
                <Box style={{ position: 'relative', display: 'flex' }}>
                  <Box
                    component="img"
                    src={img}
                    className={`grad-${wengineStat.rarity}star`}
                    style={{
                      maxWidth: 256,
                      width: '100%',
                      height: 'auto',
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Divider />
                <Box style={{ padding: '8px' }}>
                  <Flex
                    align="center"
                    style={{ flexGrow: 1, fontWeight: 'bold' }}
                  >
                    <Text
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      <StatDisplay statKey={'atk'} />
                    </Text>
                    <Text fw="bold">
                      {wengineStats && wengineStats['atk_base'].toFixed()}
                    </Text>
                  </Flex>

                  <WengineSubstatDisplay
                    substatKey={wengineStat.second_statkey}
                    substatValue={
                      wengineStats
                        ? wengineStats[wengineStat.second_statkey]
                        : 0
                    }
                  />
                </Box>
              </Box>
            </SimpleGrid>
          )}
        </Box>
        {footer && (
          <Box p="sm" py={8}>
            <Text size="sm" c="dimmed">
              Lv.{level} / Mod.{modification} / P{phase}
            </Text>
          </Box>
        )}
      </CardThemed>
    </ModalWrapper>
  )
}
