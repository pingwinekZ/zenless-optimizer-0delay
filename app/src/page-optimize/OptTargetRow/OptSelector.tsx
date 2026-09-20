import { Box, MenuItem } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import type { TargetTag } from '@zenless-optimizer/zzz/db'
import {
  getTeamFrame0,
  type ICachedCharacter,
  isComboTarget,
  type Team,
  targetTag,
} from '@zenless-optimizer/zzz/db'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { own } from '@zenless-optimizer/zzz/formula'
import {
  FullTagDisplay,
  useZzzCalcContext,
} from '@zenless-optimizer/zzz/formula-ui'
import { useMemo } from 'react'
import { ComboDrawer } from '../combo'
import { useComboMembers } from '../combo/useComboMembers'
import { comboMetricLabel } from '../OptTargetSelector'

const statTargets = [
  own.final.atk,
  own.final.hp,
  own.final.def,
  own.final.enerRegen,
  own.final.anomProf,
  own.final.anomMas,
] as const

export function OptSelector({
  character: { key: characterKey },
  team,
}: {
  team: Team
  character: ICachedCharacter
}) {
  const { tag: target } = getTeamFrame0(team)
  const calc = useZzzCalcContext()
  const { database } = useDatabaseContext()
  const tag = useMemo(() => {
    if (!target) return undefined
    return targetTag(target)
  }, [target])

  const isRotation = isComboTarget(target)
  const isAdvanced = target?.comboType === 'advanced'
  const rotationCount = target?.rotation?.length ?? 0

  const [advancedOpened, { open: openAdvanced, close: closeAdvanced }] =
    useDisclosure(false)
  const members = useComboMembers(characterKey, team)

  return (
    <>
      <DropdownButton
        color={tag ? 'green' : 'yellow'}
        title={
          tag ? (
            <Box style={{ display: 'flex', gap: 1 }}>
              <strong>Optimization Target: </strong>
              {isRotation ? (
                <span>
                  Rotation {comboMetricLabel(target?.comboKind ?? 'dmg')} (
                  {rotationCount} attack
                  {rotationCount !== 1 ? 's' : ''}
                  {isAdvanced ? ' • Advanced' : ''})
                </span>
              ) : (
                <FullTagDisplay tag={tag} />
              )}
            </Box>
          ) : (
            'Select an Optimization Target'
          )
        }
        variant={tag ? 'outline' : undefined}
        style={{ height: '100%', flexGrow: 1 }}
      >
        {rotationCount > 0 && (
          <MenuItem onClick={openAdvanced}>Advanced rotation…</MenuItem>
        )}
        {calc?.listFormulas(own.listing.formulas).map(({ tag }, i) => {
          const { name, sheet } = tag
          if (!name || !sheet) return
          return (
            <MenuItem
              key={`${i}_${tag.sheet}_${tag.name}`}
              onClick={() =>
                database.teams.setFrame0(characterKey, (frame) => ({
                  tag: {
                    ...frame.tag,
                    sheet,
                    name,
                    damageType1: undefined,
                    damageType2: undefined,
                    q: undefined,
                    qt: undefined,
                  },
                }))
              }
            >
              <Box style={{ display: 'flex', gap: 1 }}>
                <FullTagDisplay tag={tag} />
              </Box>
            </MenuItem>
          )
        })}
        {statTargets.map(({ tag }, i) => {
          const { q, qt } = tag
          if (!q || !qt) return
          return (
            <MenuItem
              key={`${i}_${q}_${qt}`}
              onClick={() =>
                database.teams.setFrame0(characterKey, (frame) => ({
                  tag: {
                    ...frame.tag,
                    q: q as TargetTag['q'],
                    qt: qt as 'final',
                    sheet: undefined,
                    name: undefined,
                    damageType1: undefined,
                    damageType2: undefined,
                  },
                }))
              }
            >
              <Box style={{ display: 'flex', gap: 1 }}>
                <FullTagDisplay tag={tag} />
              </Box>
            </MenuItem>
          )
        })}
      </DropdownButton>
      <ComboDrawer
        opened={advancedOpened}
        close={closeAdvanced}
        characterKey={characterKey}
        team={team}
        members={members}
      />
    </>
  )
}
