import type { Tag } from '@zenless-optimizer/game-opt/engine'
import { createContext } from 'react'

export const TagContext = createContext<Tag>({} as Tag)
