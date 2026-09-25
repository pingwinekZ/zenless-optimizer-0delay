import { Box } from '@mantine/core'
import React, {
  type ReactElement,
  Suspense,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router'
import { useNavigateContext } from './NavigateContext'
import {
  PageCharacters,
  PageDiscs,
  PageHome,
  PageOptimize,
  PageSettings,
  PageWengines,
  pathToTab,
  type TabKey,
} from './routes'
import { TabVisibilityContext, type TabVisibilityValue } from './TabVisibility'

function CharactersTab() {
  const { navigateToOptimize } = useNavigateContext()
  return <PageCharacters onNavigateToOptimize={navigateToOptimize} />
}

function OptimizeTab() {
  const { navigateToCharacters } = useNavigateContext()
  return <PageOptimize onNavigateToCharacters={navigateToCharacters} />
}

const TAB_COMPONENTS: Array<[TabKey, React.ComponentType]> = [
  ['home', PageHome],
  ['discs', PageDiscs],
  ['wengines', PageWengines],
  ['characters', CharactersTab],
  ['optimize', OptimizeTab],
  ['settings', PageSettings],
]

// Stagger order after the active tab: light tabs first so the main thread
// stays responsive, heaviest (AG Grid + sheet registries) last.
const MOUNT_PRIORITY: TabKey[] = [
  'home',
  'settings',
  'wengines',
  'characters',
  'discs',
  'optimize',
]

export function Tabs() {
  const location = useLocation()
  const activeKey = pathToTab(location.pathname)
  const prevKeyRef = useRef(activeKey)

  // Create all element descriptions once (stable references, but not mounted
  // until included in tree)
  const tabElements = React.useMemo(
    () =>
      new Map(
        TAB_COMPONENTS.map(
          ([key, Component]) => [key, <Component key={key} />] as const
        )
      ),
    []
  )

  // Start with only the active tab mounted. Remaining tabs mount one-at-a-time
  // in priority order with a delay between each to keep the main thread
  // responsive.
  const [mountedTabs, setMountedTabs] = useState<Set<TabKey>>(
    () => new Set([activeKey])
  )

  // Keep the previous tab visible while an unmounted tab is being prepared.
  // Without this, switching to a tab that hasn't been stagger-mounted yet
  // shows a blank page until the effect adds it to mountedTabs.
  const fallbackKeyRef = useRef<TabKey | null>(null)
  const newTabMounted = mountedTabs.has(activeKey)
  if (newTabMounted) {
    fallbackKeyRef.current = null
    prevKeyRef.current = activeKey
  } else if (activeKey !== prevKeyRef.current) {
    fallbackKeyRef.current = prevKeyRef.current
  }
  const fallbackKey = fallbackKeyRef.current

  // Mount any tab the user navigates to, even if the stagger hasn't reached it
  // yet. Wrapped in startTransition so React can yield during heavy first-mount
  // work, allowing the browser to paint the fallback tab instead of freezing.
  useEffect(() => {
    startTransition(() => {
      setMountedTabs((prev) => {
        if (prev.has(activeKey)) return prev
        return new Set(prev).add(activeKey)
      })
    })
    window.scrollTo(0, 0)
  }, [activeKey])

  useEffect(() => {
    const queue = MOUNT_PRIORITY.filter((page) => page !== activeKey)
    let i = 0
    let timerId: ReturnType<typeof setTimeout>

    function mountNext() {
      if (i < queue.length) {
        startTransition(() => {
          setMountedTabs((prev) => new Set(prev).add(queue[i]))
        })
        i++
        // Space out mounts so the browser stays responsive between heavy tabs
        timerId = setTimeout(mountNext, 100)
      }
    }

    // Start staggering after the active tab has had time to fully paint
    timerId = setTimeout(mountNext, 100)
    return () => clearTimeout(timerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box w="100%" style={{ minWidth: 0 }}>
      {TAB_COMPONENTS.map(([tabKey]) => (
        <TabRenderer
          key={tabKey}
          activeKey={activeKey}
          fallbackKey={fallbackKey}
          tabKey={tabKey}
        >
          {mountedTabs.has(tabKey) ? tabElements.get(tabKey)! : null}
        </TabRenderer>
      ))}
    </Box>
  )
}

function TabRenderer({
  activeKey,
  fallbackKey,
  tabKey,
  children,
}: {
  activeKey: TabKey
  fallbackKey: TabKey | null
  tabKey: TabKey
  children: ReactElement | null
}) {
  const isActive = activeKey === tabKey
  const isFallback = fallbackKey === tabKey
  const prevActiveRef = useRef(isActive)
  const listenersRef = useRef(new Set<() => void>())
  const deactivationListenersRef = useRef(new Set<() => void>())
  const isActiveRef = useRef(isActive)

  // Always keep the ref in sync — gated listeners read this synchronously
  isActiveRef.current = isActive

  // STABLE context value — never changes identity, so useContext never
  // triggers consumer re-renders. Activation is signaled via listeners instead.
  const [contextValue] = useState<TabVisibilityValue>(() => ({
    isActiveRef,
    addActivationListener: (cb: () => void) => {
      listenersRef.current.add(cb)
      return () => {
        listenersRef.current.delete(cb)
      }
    },
    addDeactivationListener: (cb: () => void) => {
      deactivationListenersRef.current.add(cb)
      return () => {
        deactivationListenersRef.current.delete(cb)
      }
    },
  }))

  // Fire listeners in a macrotask so the browser paints the display toggle
  // first — rAF-timed callbacks would block the tab from appearing.
  if (isActive !== prevActiveRef.current) {
    const listeners = isActive
      ? listenersRef.current
      : deactivationListenersRef.current
    const wantActive = isActive
    setTimeout(() => {
      if (isActiveRef.current !== wantActive) return // rapid switch
      for (const listener of listeners) {
        try {
          listener()
        } catch (err) {
          console.error('TabRenderer: listener threw', err)
        }
      }
    }, 0)
  }
  prevActiveRef.current = isActive

  return (
    <TabVisibilityContext value={contextValue}>
      <div
        style={{
          display: isActive || isFallback ? 'block' : 'none',
          width: '100%',
          minWidth: 0,
        }}
        id={tabKey}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </TabVisibilityContext>
  )
}
