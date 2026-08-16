import { Box, SimpleGrid, Stack } from '@mantine/core'
import { stableArr } from '@zenless-optimizer/common/util'
import { useMemo, useState } from 'react'
import type { DiscSetKey } from '../consts'
import { isDiscSetKey } from '../consts'
import type { TeamConditional } from '../db'
import { useCharacterContext, useTeam } from '../db-ui'
import { DiscSheetDisplay } from '../formula-ui'
import { DiscSetAutocomplete } from '../ui'

export function DiscSheetsDisplay() {
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const conditionals =
    team.frames[0]?.conditionals ?? stableArr<TeamConditional>()
  const [discSetKey, setDiscSetKey] = useState<DiscSetKey | ''>('')
  const discList = useMemo(() => {
    const sets = conditionals
      .map((c) => c.sheet)
      .filter(isDiscSetKey) as DiscSetKey[]
    if (discSetKey) sets.push(discSetKey)
    return [...new Set(sets)].sort((set) => (set === discSetKey ? -1 : 1))
  }, [conditionals, discSetKey])
  return (
    <Stack gap={1} style={{ paddingTop: 4 }}>
      <DiscSetAutocomplete
        discSetKey={discSetKey}
        setDiscSetKey={setDiscSetKey}
        label="Search Disc Set"
      />
      <Box>
        <SimpleGrid cols={3} spacing={1}>
          {discList.map((setKey) => (
            <DiscSheetDisplay setKey={setKey} key={setKey} />
          ))}
        </SimpleGrid>
      </Box>
    </Stack>
  )
}
