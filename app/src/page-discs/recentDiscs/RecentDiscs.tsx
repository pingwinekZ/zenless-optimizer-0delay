import { Box } from '@mantine/core'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { Fragment, memo, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDatabaseContext } from '../../db-ui'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'
import { doesDiscPassFilters } from '../scoring/discFilters'
import { RecentDiscCard } from './RecentDiscCard'

function padArray<T>(array: T[], length: number, filler: T): T[] {
  return [...array, ...Array(length - array.length).fill(filler)]
}

const RECENT_COUNT = 6

export const RecentDiscs = memo(function RecentDiscs() {
  const { database } = useDatabaseContext()
  const allDiscs = useDataManagerValues(database.discs)
  const { selectedDiscId, setSelectedDiscsIds, focusCharacter, filters } =
    useDiscTabStore(
      useShallow((s) => ({
        selectedDiscId: s.selectedDiscId,
        setSelectedDiscsIds: s.setSelectedDiscsIds,
        focusCharacter: s.focusCharacter,
        filters: s.filters,
      }))
    )

  const recent = useMemo(
    () =>
      [...allDiscs]
        .sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0))
        .filter((d) => doesDiscPassFilters(d, filters))
        .slice(0, RECENT_COUNT),
    [allDiscs, filters]
  )

  const onSelect = useCallback(
    (id: string) => {
      setSelectedDiscsIds([id])
    },
    [setSelectedDiscsIds]
  )

  return (
    <Box
      style={{
        display: 'flex',
        padding: '0 10px 10px 10px',
      }}
    >
      {padArray(recent, RECENT_COUNT, undefined).map((disc, i) => (
        <Fragment key={disc?.id ?? `empty-${i}`}>
          {i > 0 && (
            <Box
              style={{
                width: 1,
                flexShrink: 0,
                alignSelf: 'stretch',
                marginBlock: 4,
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          )}
          <Box style={{ flex: 1, minWidth: 0 }}>
            {disc ? (
              <RecentDiscCard
                disc={disc}
                focusCharacter={focusCharacter}
                isSelected={disc.id === selectedDiscId}
                onClick={() => onSelect(disc.id)}
              />
            ) : (
              <Box
                style={{
                  flex: 1,
                  minHeight: 200,
                  background: 'var(--layer-1)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  opacity: 0.3,
                }}
              />
            )}
          </Box>
        </Fragment>
      ))}
    </Box>
  )
})
