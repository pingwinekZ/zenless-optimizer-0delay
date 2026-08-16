import { Box, Button, ButtonGroup, SimpleGrid, Text } from '@mantine/core'
import { SqBadge } from '@zenless-optimizer/common/ui'
import {
  objKeyMap,
  stableArr,
  toggleInArr,
} from '@zenless-optimizer/common/util'
import { useMemo } from 'react'
import type { DiscSetKey, DiscSlotKey } from '../../consts'
import { allDiscSetKeys, allDiscSlotKeys } from '../../consts'
import type { ICachedDisc, TeamConditional } from '../../db'
import { useCharacterContext, useTeam } from '../../db-ui'
import { CharCalcMockCountProvider, DiscSheetDisplay } from '../../formula-ui'

export function DiscSetFilter({
  discBySlot,
  setFilter4,
  setFilter2,
  setSetFilter4,
  setSetFilter2,
}: {
  discBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
  setFilter4: DiscSetKey[]
  setFilter2: DiscSetKey[]
  setSetFilter4: (setFilter4: DiscSetKey[]) => void
  setSetFilter2: (setFilter2: DiscSetKey[]) => void
}) {
  const character = useCharacterContext()
  const team = useTeam(character?.key)
  const conditionals =
    team?.frames[0]?.conditionals ?? stableArr<TeamConditional>()
  const discSetBySlot = useMemo(() => {
    const discSetBySlot: Record<
      DiscSetKey,
      Record<DiscSlotKey, number>
    > = objKeyMap(allDiscSetKeys, () => objKeyMap(allDiscSlotKeys, () => 0))

    Object.values(discBySlot).forEach((discs) =>
      discs.forEach(({ setKey, slotKey }) => discSetBySlot[setKey][slotKey]++)
    )

    return discSetBySlot
  }, [discBySlot])
  return (
    <>
      <Box style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Text style={{ flexGrow: 1 }}>Disc Set Config</Text>
        <Button disabled={!setFilter4.length} onClick={() => setSetFilter4([])}>
          Reset 4p filter
        </Button>
        <Button disabled={!setFilter2.length} onClick={() => setSetFilter2([])}>
          Reset 2p filter
        </Button>
      </Box>

      <Box>
        {character && team && (
          <CharCalcMockCountProvider
            character={character}
            conditionals={conditionals}
          >
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing={1}>
              {allDiscSetKeys.map((d) => (
                <AdvSetFilterDiscCard
                  key={d}
                  numSlot={discSetBySlot[d]}
                  setKey={d}
                  setFilter4={setFilter4}
                  setFilter2={setFilter2}
                  setSetFilter4={setSetFilter4}
                  setSetFilter2={setSetFilter2}
                />
              ))}
            </SimpleGrid>
          </CharCalcMockCountProvider>
        )}
      </Box>
    </>
  )
}
function AdvSetFilterDiscCard({
  numSlot,
  setKey,
  setFilter4,
  setFilter2,
  setSetFilter4,
  setSetFilter2,
}: {
  numSlot: Record<DiscSlotKey, number>
  setKey: DiscSetKey
  setFilter4: DiscSetKey[]
  setFilter2: DiscSetKey[]
  setSetFilter4: (setFilter4: DiscSetKey[]) => void
  setSetFilter2: (setFilter2: DiscSetKey[]) => void
}) {
  const greyOut2 = !!setFilter2.length && !setFilter2.includes(setKey)
  const greyOut4 = !!setFilter4.length && !setFilter4.includes(setKey)
  return (
    <DiscSheetDisplay setKey={setKey} fade2={greyOut2} fade4={greyOut4}>
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingBottom: 4,
        }}
      >
        {Object.entries(numSlot).map(([slotKey, count]) => (
          <Box key={slotKey}>
            <SqBadge color={count ? 'primary' : 'secondary'}>{count}</SqBadge>
          </Box>
        ))}
      </Box>
      <ButtonGroup style={{ width: '100%' }}>
        <Button
          style={{ borderRadius: 0 }}
          color={
            !setFilter4.length || setFilter4.includes(setKey) ? 'green' : 'gray'
          }
          onClick={() =>
            setSetFilter4(
              setFilter4.length
                ? toggleInArr([...setFilter4], setKey)
                : [setKey]
            )
          }
        >
          Allow 4p
        </Button>
        <Button
          style={{ borderRadius: 0 }}
          color={
            !setFilter2.length || setFilter2.includes(setKey) ? 'green' : 'gray'
          }
          onClick={() =>
            setSetFilter2(
              setFilter2.length
                ? toggleInArr([...setFilter2], setKey)
                : [setKey]
            )
          }
        >
          Allow 2p
        </Button>
      </ButtonGroup>
    </DiscSheetDisplay>
  )
}
