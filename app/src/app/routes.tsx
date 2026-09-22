import { lazy } from 'react'

export type TabKey =
  | 'home'
  | 'discs'
  | 'wengines'
  | 'characters'
  | 'optimize'
  | 'settings'

export const TAB_PATHS: Record<TabKey, string> = {
  home: '/',
  discs: '/discs',
  wengines: '/wengines',
  characters: '/characters',
  optimize: '/optimize',
  settings: '/settings',
}

export function pathToTab(pathname: string): TabKey {
  const entry = (Object.entries(TAB_PATHS) as Array<[TabKey, string]>).find(
    ([, path]) => path === pathname
  )
  return entry?.[0] ?? 'home'
}

export const PageHome = lazy(() => import('@zenless-optimizer/zzz/page-home'))
export const PageSettings = lazy(
  () => import('@zenless-optimizer/zzz/page-settings')
)
export const PageWengines = lazy(
  () => import('@zenless-optimizer/zzz/page-wengines')
)
export const PageCharacters = lazy(() => import('../page-characters'))
export const PageDiscs = lazy(() => import('../page-discs'))
export const PageOptimize = lazy(() => import('../page-optimize'))
