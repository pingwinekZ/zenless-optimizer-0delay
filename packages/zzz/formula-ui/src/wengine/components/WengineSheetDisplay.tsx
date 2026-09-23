import { Box, Group, Stack, Text, Title } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { DocumentDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '@zenless-optimizer/zzz/assets'
import { getWengineStat, getWengineStats } from '@zenless-optimizer/zzz/stats'
import { StatDisplay, WengineName, ZCard } from '@zenless-optimizer/zzz/ui'
import type { IWengine } from '@zenless-optimizer/zzz/zood'
import { filterDocumentsForSelf } from '../../teammate/buffAppliesToMainUnit'
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
  const wengineStat = getWengineStat(wengineKey)
  const wengineStats = getWengineStats(wengineKey, level, phase, modification)
  const mainStatKey = wengineStat.baseStatkey
  const mainStat = mainStatKey === 'def_base' ? 'def' : 'atk'
  const substatKey = wengineStat.second_statkey
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
          <StatDisplay statKey={mainStat} />
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
  // Hide buffs that only apply to other squad members (e.g. `notOwnBuff`
  // team buffs) when viewing the owner's own sheet.
  const selfDocuments = filterDocumentsForSelf(documents)
  return (
    <Box p="md">
      <Title order={5}>{title}</Title>
      <Stack gap={4}>
        {selfDocuments.map((doc, i) => (
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
