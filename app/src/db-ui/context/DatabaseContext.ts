import { createContext, useContext } from 'react'
import type { ZzzDatabase } from '../../db'

export type DatabaseContextObj = {
  databases: ZzzDatabase[]
  setDatabase: (index: number, db: ZzzDatabase) => void
  database: ZzzDatabase
}

export const DatabaseContext = createContext({} as DatabaseContextObj)

export function useDatabaseContext() {
  return useContext(DatabaseContext)
}
