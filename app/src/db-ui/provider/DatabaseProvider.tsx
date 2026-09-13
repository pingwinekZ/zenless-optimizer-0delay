import {
  DBLocalStorage,
  loadJsonOrB64GzipFromStorage,
  SandboxStorage,
} from '@zenless-optimizer/common/database'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ZzzDatabase } from '../../db'
import { DatabaseContext, type DatabaseContextObj } from '../context'

function getValidDbIndex(): 1 | 2 | 3 | 4 {
  const parsed = parseInt(localStorage.getItem('zzz_dbIndex') || '1')
  return parsed >= 1 && parsed <= 4 ? (parsed as 1 | 2 | 3 | 4) : 1
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const dbIndex = getValidDbIndex()
  const [databases, setDatabases] = useState(() => {
    localStorage.removeItem('zzz_newTabDetection')
    localStorage.setItem('zzz_newTabDetection', 'debug')
    return ([1, 2, 3, 4] as const).map((index) => {
      if (index === dbIndex) {
        return new ZzzDatabase(index, new DBLocalStorage(localStorage, 'zzz'))
      } else {
        const dbName = `zzz_extraDatabase_${index}`
        const dbObj = loadJsonOrB64GzipFromStorage(dbName)
        const db = new ZzzDatabase(index, new SandboxStorage(dbObj, 'zzz'))
        db.toExtraLocalDB()
        return db
      }
    })
  })
  const setDatabase = useCallback(
    (index: number, db: ZzzDatabase) => {
      const dbs = [...databases]
      dbs[index] = db
      setDatabases(dbs)
    },
    [databases, setDatabases]
  )

  const database = databases[dbIndex - 1]
  const dbContextObj: DatabaseContextObj = useMemo(
    () => ({ databases, setDatabases, database, setDatabase }),
    [databases, setDatabases, database, setDatabase]
  )
  return (
    <DatabaseContext.Provider value={dbContextObj}>
      {children}
    </DatabaseContext.Provider>
  )
}
