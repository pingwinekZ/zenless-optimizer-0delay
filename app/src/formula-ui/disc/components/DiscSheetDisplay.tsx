import { Box, Divider, Group, Stack, Title } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { DocumentDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import { discDefIcon } from '../../../assets'
import type { DiscSetKey } from '../../../consts'
import { DiscSetName, ZCard } from '../../../ui'
import { discUiSheets } from '../sheets'

export function DiscSheetDisplay({
  setKey,
  fade2 = false,
  fade4 = false,
  children,
}: {
  setKey: DiscSetKey
  fade2?: boolean
  fade4?: boolean
  children?: React.ReactNode
}) {
  const discSheet = discUiSheets[setKey]
  if (!discSheet) return null
  return (
    <ZCard bgt="light" style={{ height: '100%' }}>
      <Group gap="sm" p="md" wrap="nowrap">
        <ImgIcon src={discDefIcon(setKey)} size={2} />
        <DiscSetName setKey={setKey} />
      </Group>
      {children}
      <Stack>
        {Object.entries(discSheet).map(([key, uiSheetElement]) => (
          <Box
            key={key}
            style={{
              opacity: (key === '2' ? fade2 : fade4) ? 0.5 : 1,
            }}
          >
            <DiscUiSheetElement
              uiSheetElement={uiSheetElement}
              collapse={key !== '2'}
            />
            <Divider />
          </Box>
        ))}
      </Stack>
    </ZCard>
  )
}
function DiscUiSheetElement({
  uiSheetElement,
  collapse = false,
}: {
  uiSheetElement: UISheetElement
  collapse?: boolean
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
            collapse={collapse}
          />
        ))}
      </Stack>
    </Box>
  )
}
