import { GameDesc, i18n } from '@zenless-optimizer/zzz/i18n'
import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

/**
 * Game-text namespaces (`char_X_gen`, …) are fetched on demand rather than
 * preloaded, so the first component to render one starts a namespace load.
 *
 * react-i18next's default is to *suspend* until that load resolves, and this app
 * has exactly one Suspense boundary — around the whole route tree in `App.tsx`.
 * So hovering a conditional, whose doc renders `char_X_gen` game text, unmounted
 * the entire page to the route loader and remounted it once the fetch resolved,
 * which reads as the page randomly refreshing. `useSuspense: false` keeps the
 * page mounted; the text fills in when the namespace arrives.
 *
 * Rendered with `react-dom/server` on purpose: a suspended component renders the
 * boundary's fallback into the markup, so this asserts on the fix without a DOM.
 */
describe('i18n namespace loading', () => {
  it('keeps the page mounted while an on-demand namespace loads', () => {
    // Not part of the startup set, so it is still unloaded here.
    expect(i18n.hasLoadedNamespace('char_Anby_gen')).toBe(false)

    const html = renderToStaticMarkup(
      <Suspense fallback={<div>route-fallback</div>}>
        <div>page-content</div>
        <GameDesc ns="char_Anby_gen" key18="mindscapes.1.desc" />
      </Suspense>
    )

    // Suspending would have swapped the page for the boundary's fallback...
    expect(html).not.toContain('route-fallback')
    expect(html).toContain('page-content')
    // ...and the raw `ns:key` must never be painted while it loads.
    expect(html).not.toContain('char_Anby_gen')
  })

  it('preloads the app-shell namespaces so pages never wait on a fetch', () => {
    for (const ns of [
      'ui',
      'common',
      'sidebar',
      'page_home',
      'page_optimize',
      'page_characters',
      'page_settings',
      'page_wengine',
      'discTab',
      'sheet',
      'charNames_gen',
      'statKey_gen',
    ])
      expect(i18n.options.ns).toContain(ns)
  })
})
