import { SimpleGrid, Stack } from '@mantine/core'
import { useMemo } from 'react'
import { allDiscSlotKeys } from '../../consts'
import { type DiscIds } from '../../db'
import { useDiscs, useWengine } from '../../db-ui'
import { CompactDiscCard, DiscSetCardCompact } from '../Disc'
import { CompactWengineCard } from '../Wengine'

const emptyDiscs = Object.fromEntries(
  allDiscSlotKeys.map((k) => [k, undefined])
) as Record<string, undefined>
const DEFAULT_COLS = { base: 1, sm: 1, md: 2, lg: 3, xl: 4 } as const
export function EquipGrid({
  discIds = emptyDiscs as any,
  wengineKey,
  onClick,
  columns = DEFAULT_COLS,
}: {
  discIds?: DiscIds
  wengineKey?: string
  onClick?: () => void
  columns?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}) {
  const discs = useDiscs(discIds)
  const wengine = useWengine(wengineKey)
  const discCols = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(columns).map(([k, v]) => [
          k,
          Math.max((v as number) - 1, 1),
        ])
      ) as typeof columns,
    [columns]
  )
  return (
    <SimpleGrid cols={columns} spacing="xs">
      <div key={wengine?.id}>
        <Stack>
          <CompactWengineCard
            wengineId={wengine?.id ?? wengineKey}
            onClick={onClick}
          />
          <DiscSetCardCompact discs={discs} />
        </Stack>
      </div>
      <div>
        <SimpleGrid cols={discCols} spacing="xs">
          {!!discs &&
            Object.entries(discs).map(([slotKey, disc]) => (
              <div key={disc?.id || slotKey}>
                <CompactDiscCard
                  disc={disc}
                  slotKey={slotKey}
                  onClick={onClick}
                />
              </div>
            ))}
        </SimpleGrid>
      </div>
    </SimpleGrid>
  )
}
