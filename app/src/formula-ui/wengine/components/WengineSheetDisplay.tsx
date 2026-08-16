import { Box, Group, Stack, Text, Title } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { DocumentDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import { getWengineStat, getWengineStats } from '../../../stats'
import { StatDisplay, WengineName, ZCard } from '../../../ui'
import type { IWengine } from '../../../zood'
import { wengineUiSheets } from '../sheets'

export function WengineSheetDisplay({
  headerAction,
  fade = false,
  wengine,
}: {
  headerAction?: React.ReactNode
  fade?: boolean
  wengine: IWengine
}) {
  const { key: wengineKey, level, phase, modification } = wengine
  const wengineSheet = wengineUiSheets[wengineKey]
  const wengineStats = getWengineStats(wengineKey, level, phase, modification)
  const mainStatKey = 'atk_base'
  const substatKey = getWengineStat(wengineKey)['second_statkey']
  if (!wengineSheet) return null
  return (
    <ZCard bgt="light" style={{ height: '100%' }}>
      <Group gap="sm" p="md" wrap="nowrap">
        <ImgIcon src={wengineAsset(wengineKey)} size={2} />
        <WengineName wKey={wengineKey} />
        {headerAction}
      </Group>
      <Box px="md" pb="xs">
        <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
          <StatDisplay statKey={'atk'} />
          <span>
            {toPercent(wengineStats[mainStatKey], mainStatKey).toFixed(
              statKeyToFixed(mainStatKey)
            )}
            {getUnitStr(mainStatKey)}
          </span>
        </Text>
        <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
          <StatDisplay statKey={substatKey} />
          <span>
            {toPercent(wengineStats[substatKey], substatKey).toFixed(
              statKeyToFixed(substatKey)
            )}
            {getUnitStr(substatKey)}
          </span>
        </Text>
      </Box>
      <Box style={{ opacity: fade ? 0.5 : 1 }}>
        <WengineUiSheetElement uiSheetElement={wengineSheet} />
      </Box>
    </ZCard>
  )
}

function WengineUiSheetElement({
  uiSheetElement,
}: {
  uiSheetElement: UISheetElement
}) {
  const { documents, title } = uiSheetElement
  return (
    <Box p="md">
      <Title order={5}>{title}</Title>
      <Stack gap={4}>
        {documents.map((doc, i) => (
          <DocumentDisplay
            key={i}
            document={doc}
            typoVariant="body2"
            collapse
          />
        ))}
      </Stack>
    </Box>
  )
}
