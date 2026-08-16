import { Box, SimpleGrid, Stack } from '@mantine/core'
import { stableArr } from '@zenless-optimizer/common/util'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { useContext, useMemo, useState } from 'react'
import type { WengineKey } from '../consts'
import { isWengineKey } from '../consts'
import type { TeamConditional } from '../db'
import { useCharacterContext, useTeam } from '../db-ui'
import { WengineSheetDisplay } from '../formula-ui'
import { WengineAutocomplete } from '../ui'

export function WengineSheetsDisplay() {
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)
  const tagCtx = useContext(TagContext)
  const conditionals =
    team?.frames?.[0]?.conditionals ?? stableArr<TeamConditional>()
  const [wkey, setWkey] = useState<WengineKey | ''>('')
  const wList = useMemo(() => {
    const sets = conditionals.map((c) => c.sheet).filter(isWengineKey)
    if (wkey) sets.push(wkey)
    return [...new Set(sets)].sort((set) => (set === wkey ? -1 : 1))
  }, [conditionals, wkey])
  const tagValue = useMemo(
    () => ({ ...tagCtx, src: characterKey }),
    [tagCtx, characterKey]
  )
  return (
    <Stack gap={1} style={{ paddingTop: 4 }}>
      <WengineAutocomplete wkey={wkey} setWKey={setWkey} />
      <Box>
        <SimpleGrid cols={3} spacing={1}>
          {wList.map((wk) => (
            <TagContext.Provider key={wk} value={tagValue}>
              <WengineSheetDisplay
                wengine={{
                  key: wk,
                  level: 60,
                  phase: 5,
                  modification: 1,
                }}
              />
            </TagContext.Provider>
          ))}
        </SimpleGrid>
      </Box>
    </Stack>
  )
}
