// Wrap Mantine in @layer so our unlayered overrides below always win,
// regardless of how Vite orders CSS chunks in dev vs prod builds.
// Every @mantine/* package that ships a stylesheet must be listed here — the
// packages do not import their own CSS. Mantine's form/modals/hooks/store ship
// no CSS; add `@mantine/<pkg>/styles.layer.css` when a new package is used,
// otherwise its component mounts unstyled (wrong position/size, no shadows).
import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import './fonts.css'
import './tokens.css'
import './styles.scss'
import './components.css'
import './mantine-overrides.css'
// Base AG Grid theme must load BEFORE overrides so equal-specificity
// rules in ag-grid-overrides.css win the cascade.
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import './ag-grid-overrides.css'
import 'overlayscrollbars/overlayscrollbars.css'
import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  ExternalFilterModule,
  InfiniteRowModelModule,
  LocaleModule,
  ModuleRegistry,
  PaginationModule,
  PinnedRowModule,
  provideGlobalGridOptions,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  ScrollApiModule,
} from 'ag-grid-community'
import React from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import App from './app/App'

// Selective AG Grid modules (mirrors hsr-optimizer) instead of
// AllCommunityModule: pagination, pinned top rows, external filter,
// row selection, sorting, locale text. Cuts ~large chunk from the bundle.
ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  ExternalFilterModule,
  InfiniteRowModelModule,
  LocaleModule,
  PaginationModule,
  PinnedRowModule,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  ScrollApiModule,
])
provideGlobalGridOptions({ theme: 'legacy' })

// Defer analytics past first paint so GA init never blocks initial render.
const gaId = process.env.NX_GA_TRACKINGID as string | undefined
if (gaId) {
  const initGA = () => ReactGA.initialize(gaId)
  if (typeof requestIdleCallback !== 'undefined')
    requestIdleCallback(initGA, { timeout: 3000 })
  else setTimeout(initGA, 1500)
}
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
