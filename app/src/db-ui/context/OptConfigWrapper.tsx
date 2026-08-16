import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import { createContext, useMemo } from 'react'
import type { OptConfig } from '../../db'
import { useDatabaseContext } from './DatabaseContext'

export const OptConfigContext = createContext({
  optConfigId: '',
  optConfig: {} as OptConfig,
})
export function OptConfigProvider({
  optConfigId,
  children,
}: {
  optConfigId: string
  children: React.ReactNode
}) {
  const { database } = useDatabaseContext()
  const optConfig = useDataManagerBase(database.optConfigs, optConfigId)!
  const providerValue = useMemo(
    () => ({ optConfigId, optConfig }),
    [optConfigId, optConfig]
  )
  return (
    <OptConfigContext.Provider value={providerValue}>
      {children}
    </OptConfigContext.Provider>
  )
}
