import { Box, Divider, Flex, Stack, Text } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { DocumentDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon, wengineAsset } from '../../assets'
import type { DiscSetKey, WengineKey } from '../../consts'
import type { ICachedWengine } from '../../db'
import { DiscSetName, WengineName, ZCard } from '../../ui'
import { discUiSheets } from '../disc/sheets'
import { wengineUiSheets } from '../wengine/sheets'
import {
  filterDocumentsForMainUnit,
  hasMainUnitDocuments,
} from './buffAppliesToMainUnit'

export function teammateWengineHasMainUnitBuffs(key: WengineKey): boolean {
  const wengineSheet = wengineUiSheets[key]
  if (!wengineSheet) return false
  return hasMainUnitDocuments(wengineSheet.documents)
}

export function teammateDiscHasMainUnitBuffs(
  setKey: DiscSetKey,
  count: number
): boolean {
  const discSheet = discUiSheets[setKey]
  if (!discSheet) return false
  return (
    (count >= 2 && hasMainUnitDocuments(discSheet['2']?.documents ?? [])) ||
    (count >= 4 && hasMainUnitDocuments(discSheet['4']?.documents ?? []))
  )
}

export function TeammateWengineSheetDisplay({
  wengine,
}: {
  wengine: ICachedWengine
}) {
  const wengineSheet = wengineUiSheets[wengine.key]
  if (!wengineSheet) return null

  const documents = filterDocumentsForMainUnit(wengineSheet.documents)
  if (!documents.length) return null

  return (
    <ZCard bgt="light" style={{ height: '100%' }}>
      <Flex gap="sm" align="center" p="sm">
        <ImgIcon src={wengineAsset(wengine.key)} size={2} />
        <Text size="sm" fw={600}>
          <WengineName wKey={wengine.key} />
        </Text>
      </Flex>
      <Stack gap="xs" px="sm" pb="sm">
        {documents.map((document, index) => (
          <DocumentDisplay
            key={index}
            document={document}
            typoVariant="body2"
          />
        ))}
      </Stack>
    </ZCard>
  )
}

export function TeammateDiscSheetDisplay({
  setKey,
  fade2 = false,
  fade4 = false,
}: {
  setKey: DiscSetKey
  fade2?: boolean
  fade4?: boolean
}) {
  const discSheet = discUiSheets[setKey]
  if (!discSheet) return null

  const pieces = (
    [['2', fade2] as const, ['4', fade4] as const] as const
  ).flatMap(([piece, faded]) => {
    if (faded) return []
    const uiSheetElement = discSheet[piece] as UISheetElement | undefined
    if (!uiSheetElement) return []
    const documents = filterDocumentsForMainUnit(uiSheetElement.documents)
    if (!documents.length) return []
    return [{ piece, uiSheetElement, documents }]
  })

  if (!pieces.length) return null

  return (
    <ZCard bgt="light" style={{ height: '100%' }}>
      <Flex gap="sm" align="center" p="sm">
        <ImgIcon src={discDefIcon(setKey)} size={2} />
        <Text size="sm" fw={600}>
          <DiscSetName setKey={setKey} />
        </Text>
      </Flex>
      <Stack gap={0}>
        {pieces.map(({ piece, uiSheetElement, documents }, idx) => (
          <Box key={piece}>
            {idx > 0 && <Divider />}
            <Box p="sm">
              <Text size="sm" fw={500} mb="xs">
                {uiSheetElement.title}
              </Text>
              <Stack gap="xs">
                {documents.map((document, index) => (
                  <DocumentDisplay
                    key={index}
                    document={document}
                    typoVariant="body2"
                    collapse={piece !== '2'}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
    </ZCard>
  )
}
