import { Box, SimpleGrid, Stack } from '@mantine/core'
import { stableArr } from '@zenless-optimizer/common/util'
import type { DiscSetKey } from '@zenless-optimizer/zzz/consts'
import { isDiscSetKey } from '@zenless-optimizer/zzz/consts'
import type { TeamConditional } from '@zenless-optimizer/zzz/db'
import { useCharacterContext, useTeam } from '@zenless-optimizer/zzz/db-ui'
import { DiscSheetDisplay } from '@zenless-optimizer/zzz/formula-ui'
import { DiscSetAutocomplete } from '@zenless-optimizer/zzz/ui'
import { useMemo, useState } from 'react'

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
