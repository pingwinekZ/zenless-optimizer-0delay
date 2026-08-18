import { Box, Flex, MantineProvider } from '@mantine/core'
import { ScrollTop } from '@zenless-optimizer/common/ui'
import { DatabaseProvider } from '../db-ui'
import '../i18n' // import to load translations
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { CharacterKey } from '../consts'
import PageCharacters from '../page-characters'
import PageDiscs from '../page-discs'
import PageHome from '../page-home'
import PageOptimize from '../page-optimize'
import PageSettings from '../page-settings'
import PageWengines from '../page-wengines'
import { createMantineTheme, themeResolver, useThemeStore } from '../theme'
import Footer from './Footer'
import Header from './Header'
import { LayoutSider } from './LayoutSider'
import { NavigateContextProvider, useNavigateContext } from './NavigateContext'
import { type TabKey, useTabStore } from './useTabStore'

// Priority order for staggered mounting of inactive tabs
const TAB_MOUNT_PRIORITY: TabKey[] = [
  'optimize',
  'characters',
  'discs',
  'wengines',
  'settings',
  'home',
]
const TAB_MOUNT_DELAY = 200 // ms between each tab mount

export default function App() {
  const seedColor = useThemeStore((s) => s.seedColor)
  const mantineTheme = useMemo(() => createMantineTheme(seedColor), [seedColor])

  return (
    <MantineProvider
      theme={mantineTheme}
      cssVariablesResolver={themeResolver}
      defaultColorScheme="dark"
    >
      <DatabaseProvider>
        <NavigateContextProvider>
          <Content />
          <ScrollTop />
        </NavigateContextProvider>
      </DatabaseProvider>
    </MantineProvider>
  )
}

function TabRenderer() {
  const activeTab = useTabStore((s) => s.activeTab)
  const { navigateToOptimize } = useNavigateContext()
  const [mountedTabs, setMountedTabs] = useState<Set<TabKey>>(
    () => new Set([activeTab])
  )

  // Staggered mount: mount inactive tabs one-by-one on a delay
  useEffect(() => {
    const toMount = TAB_MOUNT_PRIORITY.filter(
      (t) => t !== activeTab && !mountedTabs.has(t)
    )
    if (toMount.length === 0) return

    let i = 0
    const timers: number[] = []

    const tryMountNext = () => {
      if (i >= toMount.length) return
      const tab = toMount[i]
      setMountedTabs((prev) => new Set([...prev, tab]))
      i++
      if (i < toMount.length) {
        timers.push(window.setTimeout(tryMountNext, TAB_MOUNT_DELAY))
      }
    }

    timers.push(window.setTimeout(tryMountNext, TAB_MOUNT_DELAY))

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
    // Only run on mount (when activeTab changes, keep previously mounted tabs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNavigateToOptimize = useCallback(
    (characterKey: CharacterKey) => {
      navigateToOptimize(characterKey)
    },
    [navigateToOptimize]
  )

  const pageMap: Record<TabKey, ReactNode> = useMemo(
    () => ({
      home: <PageHome />,
      discs: <PageDiscs />,
      wengines: <PageWengines />,
      characters: (
        <PageCharacters onNavigateToOptimize={handleNavigateToOptimize} />
      ),
      optimize: <PageOptimize />,
      settings: <PageSettings />,
    }),
    [handleNavigateToOptimize]
  )

  return (
    <>
      {TAB_MOUNT_PRIORITY.map((tab) => {
        // Always render active tab even if not yet mounted via staggered mount
        if (!mountedTabs.has(tab) && tab !== activeTab) return null
        const isActive = tab === activeTab
        return (
          <Box
            key={tab}
            style={{
              display: isActive ? undefined : 'none',
              width: '100%',
            }}
          >
            {pageMap[tab]}
          </Box>
        )
      })}
    </>
  )
}

function Content() {
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  // Sync tab state with browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#/', '')
      const tab = (hash.split('?')[0] || 'home') as TabKey
      const ALL_TABS: TabKey[] = [
        'home',
        'discs',
        'wengines',
        'characters',
        'optimize',
        'settings',
      ]
      if ((ALL_TABS as string[]).includes(tab)) {
        setActiveTab(tab, false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setActiveTab])

  return (
    <Flex direction="column" mih="100vh" pos="relative">
      <Header anchor="back-to-top-anchor" />
      <Flex gap={8} style={{ flex: 1 }}>
        <LayoutSider />
        <Box
          style={{
            padding: '10px 10px 0 10px',
            minHeight: 280,
            overflow: 'initial',
            width: '100%',
          }}
        >
          <TabRenderer />
        </Box>
      </Flex>

      {/* make sure footer is always at bottom */}
      <div style={{ flexGrow: 1 }} />

      <Footer />
    </Flex>
  )
}
