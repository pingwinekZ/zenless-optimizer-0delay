import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { createContext, type ReactNode, useCallback, useContext } from 'react'
import { useTabStore } from './useTabStore'

interface NavigateContextValue {
  navigateToOptimize: (characterKey: CharacterKey) => void
  navigateToHome: () => void
  navigateToCharacters: () => void
}

const NavigateContext = createContext<NavigateContextValue>({
  navigateToOptimize: () => {},
  navigateToHome: () => {},
  navigateToCharacters: () => {},
})

export function useNavigateContext() {
  return useContext(NavigateContext)
}

export function NavigateContextProvider({ children }: { children: ReactNode }) {
  const { database } = useDatabaseContext()

  const navigateToOptimize = useCallback(
    (characterKey: CharacterKey) => {
      database.dbMeta.set({ optCharKey: characterKey })
      window.history.pushState({}, '', `#/optimize?character=${characterKey}`)
      useTabStore.getState().setActiveTab('optimize', false)
    },
    [database]
  )

  const navigateToHome = useCallback(() => {
    useTabStore.getState().setActiveTab('home')
  }, [])

  const navigateToCharacters = useCallback(() => {
    useTabStore.getState().setActiveTab('characters')
  }, [])

  return (
    <NavigateContext.Provider
      value={{ navigateToOptimize, navigateToHome, navigateToCharacters }}
    >
      {children}
    </NavigateContext.Provider>
  )
}
