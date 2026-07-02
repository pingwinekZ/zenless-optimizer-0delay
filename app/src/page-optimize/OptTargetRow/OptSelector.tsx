import { Box, MenuItem } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useCallback, useMemo } from 'react'
import type { TargetTag } from '../../db'
import {
  getTeamFrame0,
  type ICachedCharacter,
  type Team,
  targetTag,
} from '../../db'
import { useDatabaseContext } from '../../db-ui'
import { own } from '../../formula'
import { FullTagDisplay, useZzzCalcContext } from '../../formula-ui'
import { RotationConfigDialog } from '../RotationConfigDialog'

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

  const isRotation = !!target?.rotation
  const rotationCount = target?.rotation?.length ?? 0

  const [rotationOpened, { open: openRotation, close: closeRotation }] =
    useDisclosure(false)

  const handleRotationChange = useCallback(
    (rotation: Array<{ sheet: string; name: string }> | undefined) => {
      database.teams.setFrame0(characterKey, { tag: { rotation } })
    },
    [database, characterKey]
  )

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
                  Rotation DMG ({rotationCount} attack
                  {rotationCount !== 1 ? 's' : ''})
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
        <MenuItem
          onClick={openRotation}
          style={{ fontWeight: isRotation ? 'bold' : undefined }}
        >
          Rotation DMG
        </MenuItem>
        {calc?.listFormulas(own.listing.formulas).map(({ tag }, i) => {
          const { name, sheet } = tag
          if (!name || !sheet) return
          return (
            <MenuItem
              key={`${i}_${tag.sheet}_${tag.name}`}
              onClick={() =>
                database.teams.setFrame0(characterKey, {
                  tag: {
                    sheet,
                    name,
                  },
                })
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
                database.teams.setFrame0(characterKey, {
                  tag: {
                    q: q as TargetTag['q'],
                    qt: qt as 'final',
                  },
                })
              }
            >
              <Box style={{ display: 'flex', gap: 1 }}>
                <FullTagDisplay tag={tag} />
              </Box>
            </MenuItem>
          )
        })}
      </DropdownButton>
      <RotationConfigDialog
        opened={rotationOpened}
        close={closeRotation}
        rotation={target?.rotation}
        onRotationChange={handleRotationChange}
      />
    </>
  )
}
