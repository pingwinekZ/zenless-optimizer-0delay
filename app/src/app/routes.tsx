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

// Tabs are imported eagerly, not through `React.lazy` (this is what
// hsr-optimizer does with all of its tabs).
//
// With lazy routes, the first switch to a tab had to fetch and execute that
// tab's whole module graph before it could render: +630 modules for /optimize
// and +656 for /discs in dev (AG Grid, the generated sheet registries, the disc
// editor), while /wengines added none. That pause was the visible lag on every
// first switch, worst on the heaviest tab. Importing statically means the graph
// is already loaded by the time anything is clickable, so switching is a pure
// render — at the cost of a larger initial load, which is the same trade
// hsr-optimizer makes. In dev, `server.warmup` in `vite.config.mts` transforms
// this whole graph at server start rather than on the browser's first request.
export { default as PageHome } from '@zenless-optimizer/zzz/page-home'
export { default as PageSettings } from '@zenless-optimizer/zzz/page-settings'
export { default as PageWengines } from '@zenless-optimizer/zzz/page-wengines'
export { default as PageCharacters } from '../page-characters'
export { default as PageDiscs } from '../page-discs'
export { default as PageOptimize } from '../page-optimize'
