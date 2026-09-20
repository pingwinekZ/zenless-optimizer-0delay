import type { TagRowSxFunc } from '@zenless-optimizer/game-opt/sheet-ui'
import { TagRowSxContext } from '@zenless-optimizer/game-opt/sheet-ui'
import { getTeamFrame0 } from '@zenless-optimizer/zzz/db'
import { useCharacterContext, useTeam } from '@zenless-optimizer/zzz/db-ui'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
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
