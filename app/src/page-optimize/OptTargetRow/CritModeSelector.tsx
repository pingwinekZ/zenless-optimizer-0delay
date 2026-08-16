import { Box, MenuItem } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import type { critModeKey } from '../../db'
import { critModeKeys, getTeamFrame0 } from '../../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../../db-ui'

// TODO: translation
const modeMap: Record<critModeKey, string> = {
  avg: 'Average',
  crit: 'Crit Hit',
  nonCrit: 'Non-Crit Hit',
}
export function CritModeSelector() {
  const { database } = useDatabaseContext()
  const character = useCharacterContext()!
  const team = useTeam(character.key)!
  const { critMode } = getTeamFrame0(team)
  return (
    <DropdownButton
      title={
        <Box style={{ textWrap: 'nowrap' }}>Hit mode: {modeMap[critMode]}</Box>
      }
    >
      {critModeKeys.map((k) => (
        <MenuItem
          key={k}
          style={
            critMode === k
              ? { backgroundColor: 'var(--mantine-color-blue-light)' }
              : undefined
          }
          disabled={critMode === k}
          onClick={() =>
            database.teams.setFrame0(character.key, { critMode: k })
          }
        >
          {modeMap[k]}
        </MenuItem>
      ))}
    </DropdownButton>
  )
}
