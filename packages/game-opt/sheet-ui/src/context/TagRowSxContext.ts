import type { Tag } from '@zenless-optimizer/game-opt/engine'
import { createContext } from 'react'

export type TagRowSxFunc = (tag: Tag) => Record<string, any> | undefined

export const TagRowSxContext = createContext<TagRowSxFunc | undefined>(
  undefined
)
