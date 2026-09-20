import { Box, Button, SimpleGrid, Stack } from '@mantine/core'
import { CardThemed, ImgIcon } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import {
  characterAsset,
  factionDefIcon,
  specialityDefIcon,
} from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import {
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import { allStats, getCharStat } from '@zenless-optimizer/zzz/stats'
import { ElementIcon } from '@zenless-optimizer/zzz/svgicons'
import {
  CharacterName,
  CharacterSingleSelectionModal,
  ZCard,
} from '@zenless-optimizer/zzz/ui'
import { Suspense, useCallback, useState } from 'react'

const EXTRA_TEAMMATE_SLOTS = [1, 2] as const

export function TeammatesSection() {
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const [pickingSlot, setPickingSlot] = useState<1 | 2>()
  const setTeammate = useCallback(
    (teammateKey: CharacterKey | null, slot: 1 | 2) => {
      database.teams.setTeammate(characterKey, teammateKey, slot - 1)
    },
    [characterKey, database.teams]
  )
  const icons = useCallback(
    (charKey: CharacterKey | undefined) =>
      charKey
        ? [
            characterAsset(charKey, 'interknot'),
            specialityDefIcon(allStats.char[charKey]?.specialty),
            factionDefIcon(allStats.char[charKey]?.faction),
          ]
        : [],
    []
  )

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={1}>
      <Suspense fallback={false}>
        <CharacterSingleSelectionModal
          show={pickingSlot !== undefined}
          onHide={() => setPickingSlot(undefined)}
          onSelect={(ck) => {
            if (pickingSlot) setTeammate(ck, pickingSlot)
            setPickingSlot(undefined)
          }}
          showNone
        />
      </Suspense>
      {EXTRA_TEAMMATE_SLOTS.map((slot) => {
        const teammateKey = team.teammates[slot]?.characterKey
        return (
          <div key={slot}>
            <Stack gap={1}>
              <Button
                fullWidth
                color={
                  (teammateKey && getCharStat(teammateKey).attribute) ||
                  undefined
                }
                onClick={() => setPickingSlot(slot)}
              >
                {(teammateKey && (
                  <CharacterName characterKey={teammateKey} />
                )) ||
                  `Add ${slot === 1 ? 'First' : 'Second'} Teammate`}
              </Button>
              {teammateKey && (
                <ZCard bgt="dark">
                  <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={0.5}>
                    {range(0, 2).map((icon) => (
                      <div key={icon} style={{ height: '90px' }}>
                        <TeammateIconCard>
                          <ImgIcon size={5} src={icons(teammateKey)?.[icon]} />
                        </TeammateIconCard>
                      </div>
                    ))}
                    <div>
                      <TeammateIconCard>
                        <ElementIcon
                          ele={getCharStat(teammateKey)?.attribute}
                          iconProps={{
                            style: { width: '2.5em', height: '2.5em' },
                          }}
                        />
                      </TeammateIconCard>
                    </div>
                  </SimpleGrid>
                </ZCard>
              )}
            </Stack>
          </div>
        )
      })}
    </SimpleGrid>
  )
}

function TeammateIconCard({ children }: { children?: React.ReactNode }) {
  return (
    <CardThemed
      bgt="light"
      style={{
        height: '100%',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          padding: 4,
          display: 'flex',
          justifyContent: 'center',
          height: '100%',
          alignItems: 'center',
        }}
      >
        {children}
      </Box>
    </CardThemed>
  )
}
