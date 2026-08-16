import '@fontsource-variable/inter'
// Wrap Mantine in @layer so our unlayered overrides below always win,
// regardless of how Vite orders CSS chunks in dev vs prod builds.
import '@mantine/core/styles.layer.css'
import './fonts.css'
import './tokens.css'
import './styles.scss'
import './mantine-overrides.css'
// Base AG Grid theme must load BEFORE overrides so equal-specificity
// rules in ag-grid-overrides.css win the cascade.
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import './ag-grid-overrides.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import App from './app/App'

ReactGA.initialize(process.env.NX_GA_TRACKINGID as any)
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
