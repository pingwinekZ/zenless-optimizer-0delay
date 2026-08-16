import { Flex } from '@mantine/core'
import { useCharacterContext, useTeam } from '../../db-ui'
import { TeammateCard } from './TeammateCard'

const TEAMMATE_SLOTS = [0, 1] as const

export function TeammatesSection({
  showCharPassives,
  showWenginePassives,
}: {
  showCharPassives: boolean
  showWenginePassives: boolean
}) {
  const mainChar = useCharacterContext()!
  const team = useTeam(mainChar.key)!

  const teammates = team.teammates
  const extraTeammates = TEAMMATE_SLOTS.map(
    (slotIndex) => teammates[slotIndex + 1]
  )

  return (
    <Flex gap={10} style={{ flex: 1 }}>
      {TEAMMATE_SLOTS.map((slotIndex) => (
        <TeammateCard
          key={slotIndex}
          slotIndex={slotIndex}
          characterKey={extraTeammates[slotIndex]?.characterKey}
          teammateDatum={extraTeammates[slotIndex]}
          showCharPassives={showCharPassives}
          showWenginePassives={showWenginePassives}
        />
      ))}
    </Flex>
  )
}
