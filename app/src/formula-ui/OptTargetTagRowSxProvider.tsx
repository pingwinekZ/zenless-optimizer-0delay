import type { TagRowSxFunc } from '@zenless-optimizer/game-opt/sheet-ui'
import { TagRowSxContext } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { getTeamFrame0 } from '../db'
import { useCharacterContext, useTeam } from '../db-ui'
import type { Tag } from '../formula'
import { isOptTargetTag, optTargetRowSx } from './optTarget'

export function OptTargetTagRowSxProvider({
  children,
}: {
  children: ReactNode
}) {
  const character = useCharacterContext()
  const team = useTeam(character?.key)
  const optTarget = team ? getTeamFrame0(team).tag : undefined

  const getTagRowSx = useCallback(
    (tag: Tag) => (isOptTargetTag(tag, optTarget) ? optTargetRowSx : undefined),
    [optTarget]
  )

  return (
    <TagRowSxContext.Provider value={getTagRowSx as TagRowSxFunc}>
      {children}
    </TagRowSxContext.Provider>
  )
}
