import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

// Probably a way to auto-populate this.
export const languageCodeList = [
  'chs',
  'cht',
  'de',
  'en',
  'es',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'th',
  'tr',
  'vi',
]

/**
 * App-shell / UI namespaces, loaded at startup (19 files, ~34 KB for `en`).
 *
 * These are everything reachable from the first paint, so preloading them means
 * a page switch never waits on a translation fetch and no page component ever
 * renders before its strings exist. Per-entity game text (`char_*_gen`,
 * `wengine_*_gen`, `disc_*_gen`, …) is deliberately left on demand — 190+
 * namespaces and ~2 MB per language is not worth blocking startup for — and
 * those loads no longer suspend the page (see `react` below).
 */
export const CORE_NAMESPACES = [
  'build',
  'charNames_gen',
  'common',
  'disc',
  'discNames_gen',
  'discTab',
  'header',
  'loadout',
  'page_characters',
  'page_home',
  'page_optimize',
  'page_settings',
  'page_wengine',
  'sheet',
  'sidebar',
  'statKey_gen',
  'ui',
  'wengineNames',
  'wengineNames_gen',
] as const

/**
 * @see: https://www.i18next.com/translation-function/essentials
 * @see: https://react.i18next.com/latest/using-with-hooks
 */
i18n
  // load translation using http ->
  // see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Configure localization.
  .init({
    // debug: process.env.NODE_ENV === "development",
    // Use English strings by default, if the current language does not include
    // the specified string.
    initAsync: true,
    fallbackLng: 'en',
    // fallbackLng: 'dev', // Switch to this to force the fallback value on missing strings.

    // List all translation namespaces.
    ns: [...CORE_NAMESPACES],
    // Specify the default namespace.
    defaultNS: 'ui',

    // Only use the language code, skipping the region code.
    // For example, en-US becomes simply en.
    load: 'languageOnly',

    returnNull: false,

    backend: {
      // Path to load localization data from.
      // Uses Vite's BASE_URL to correctly resolve paths on GitHub Pages.
      loadPath: `${import.meta.env.BASE_URL}assets/locales/{{lng}}/{{ns}}.json`,
    },
    interpolation: {
      escapeValue: false, // react does interlopation already
      skipOnVariables: false, // Enables passing nested interpolation
    },

    react: {
      // Never let a namespace fetch suspend.
      //
      // react-i18next defaults to suspending when a namespace is still loading,
      // and the app has a single Suspense boundary around the whole route tree —
      // so the first component to ask for a not-yet-loaded namespace (the
      // conditional hover docs' `char_X_gen` game text, character/W-Engine
      // sheets, …) unmounted the *entire page* to the loader and remounted it
      // when the fetch resolved. That reads as the page randomly refreshing on
      // hover. Without suspension the component renders immediately and
      // re-renders with its text once the namespace arrives.
      useSuspense: false,
    },
  })

// https://www.i18next.com/translation-function/formatting#adding-custom-format-function
i18n.services.formatter?.add('percent', (value, _lng, options) => {
  return (value * 100).toFixed(options.fixed)
})
i18n.services.formatter?.add('fixed', (value, _lng, options) => {
  return value.toFixed(options.fixed)
})

export { i18n }
