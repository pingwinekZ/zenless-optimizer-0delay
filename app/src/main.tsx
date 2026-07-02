import '@fontsource-variable/inter'
import '@mantine/core/styles.css'
import './fonts.css'
import './tokens.css'
import './mantine-overrides.css'
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
