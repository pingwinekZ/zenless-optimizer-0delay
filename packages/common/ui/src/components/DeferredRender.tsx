import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

interface DeferCreateContextValue {
  activated: boolean
  activate: () => void
}

const DeferCreateContext = createContext<DeferCreateContextValue>({
  activated: false,
  activate: () => {},
})

export function DeferCreateProvider({
  resetKey,
  enabled,
  children,
}: {
  resetKey: unknown
  enabled: boolean
  children: ReactNode
}) {
  const [activated, setActivated] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setActivated(false)
    if (enabled) {
      timerRef.current = setTimeout(() => setActivated(true), 100)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetKey, enabled])

  const activate = useCallback(() => setActivated(true), [])

  return (
    <DeferCreateContext.Provider value={{ activated, activate }}>
      {children}
    </DeferCreateContext.Provider>
  )
}

export function DeferCreate({ children }: { children: ReactNode }) {
  const { activated, activate } = useContext(DeferCreateContext)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (activated && !mounted) {
      const timer = setTimeout(() => setMounted(true), 100)
      return () => clearTimeout(timer)
    }
    return
  }, [activated, mounted])

  useEffect(() => {
    if (activated) {
      activate()
    }
  }, [activated, activate])

  if (!mounted) return null
  return children
}
