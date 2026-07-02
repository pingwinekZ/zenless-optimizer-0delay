import { Box } from '@mantine/core'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useShallow } from 'zustand/react/shallow'
import { useDatabaseContext } from '../../db-ui'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'
import { BottomToolbarLeft, BottomToolbarRight } from './BottomToolbar'
import { DiscPreview } from './DiscPreview'
import { RelicInsight } from './RelicInsight'

export function BottomDock({ onShowDup }: { onShowDup: () => void }) {
  const { database } = useDatabaseContext()
  const allDiscs = useDataManagerValues(database.discs)
  const { selectedDiscId, focusCharacter } = useDiscTabStore(
    useShallow((s) => ({
      selectedDiscId: s.selectedDiscId,
      focusCharacter: s.focusCharacter,
    }))
  )

  const selectedDisc = selectedDiscId
    ? (allDiscs.find((d) => d.id === selectedDiscId) ?? null)
    : null

  return (
    <Box style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 320,
          flexShrink: 0,
        }}
      >
        <BottomToolbarLeft />
        <DiscPreview disc={selectedDisc} focusCharacter={focusCharacter} />
      </Box>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <BottomToolbarRight onShowDup={onShowDup} />
        <RelicInsight disc={selectedDisc} />
      </Box>
    </Box>
  )
}
