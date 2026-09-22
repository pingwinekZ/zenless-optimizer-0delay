import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { createContext, type ReactNode, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router'

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
  const navigate = useNavigate()

  const navigateToOptimize = useCallback(
    (characterKey: CharacterKey) => {
      database.dbMeta.set({ optCharKey: characterKey })
      navigate(`/optimize?character=${characterKey}`)
    },
    [database, navigate]
  )

  const navigateToHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const navigateToCharacters = useCallback(() => {
    navigate('/characters')
  }, [navigate])

  return (
    <NavigateContext.Provider
      value={{ navigateToOptimize, navigateToHome, navigateToCharacters }}
    >
      {children}
    </NavigateContext.Provider>
  )
}
