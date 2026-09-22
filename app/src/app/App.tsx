import { Box, Center, Flex, Loader, MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { ScrollTop } from '@zenless-optimizer/common/ui'
import { DatabaseProvider } from '@zenless-optimizer/zzz/db-ui'
import '@zenless-optimizer/zzz/i18n' // import to load translations
import { Gradient } from '@zenless-optimizer/zzz/rendering/gradient'
import {
  createMantineTheme,
  themeResolver,
  useThemeStore,
} from '@zenless-optimizer/zzz/theme'
import { Suspense, useEffect, useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { LayoutSider } from './LayoutSider'
import { NavigateContextProvider, useNavigateContext } from './NavigateContext'
import {
  PageCharacters,
  PageDiscs,
  PageHome,
  PageOptimize,
  PageSettings,
  PageWengines,
} from './routes'

// Initial gradient setup before first render. The Discs grid colors score
// columns from a theme-derived scale, so it needs a value before the first
// paint rather than on the first effect.
{
  const initTheme = createMantineTheme(useThemeStore.getState().seedColor)
  Gradient.setTheme(initTheme.colors!.dark![8], initTheme.colors!.primary![4])
}

export default function App() {
  const seedColor = useThemeStore((s) => s.seedColor)
  const mantineTheme = useMemo(() => createMantineTheme(seedColor), [seedColor])

  useEffect(() => {
    Gradient.setTheme(
      mantineTheme.colors!.dark![8],
      mantineTheme.colors!.primary![4]
    )
  }, [mantineTheme])

  return (
    <MantineProvider
      theme={mantineTheme}
      cssVariablesResolver={themeResolver}
      defaultColorScheme="dark"
    >
      <DatabaseProvider>
        <ModalsProvider>
          {/* `width: fit-content` keeps short messages narrow instead of
              always occupying the full `containerWidth` (440px) */}
          <Notifications
            position="top-right"
            styles={{ root: { width: 'fit-content' } }}
          />
          <HashRouter>
            <NavigateContextProvider>
              <Content />
              <ScrollTop />
            </NavigateContextProvider>
          </HashRouter>
        </ModalsProvider>
      </DatabaseProvider>
    </MantineProvider>
  )
}

function CharactersRoute() {
  const { navigateToOptimize } = useNavigateContext()
  return <PageCharacters onNavigateToOptimize={navigateToOptimize} />
}

function Content() {
  return (
    <Flex direction="column" mih="100vh" pos="relative" id="back-to-top-anchor">
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
          <Suspense
            fallback={
              <Center mih={280}>
                <Loader />
              </Center>
            }
          >
            <Routes>
              <Route path="/" element={<PageHome />} />
              <Route path="/discs" element={<PageDiscs />} />
              <Route path="/wengines" element={<PageWengines />} />
              <Route path="/characters" element={<CharactersRoute />} />
              <Route path="/optimize" element={<PageOptimize />} />
              <Route path="/settings" element={<PageSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Box>
      </Flex>
    </Flex>
  )
}
