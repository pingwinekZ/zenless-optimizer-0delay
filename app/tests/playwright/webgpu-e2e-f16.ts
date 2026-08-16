import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

/**
 * Forced-f16 parity check: loads the harness with ?f16=1 so the solver asks
 * the adapter for `shader-f16`. On devices without the feature (e.g.
 * SwiftShader) it must warn and fall back to f32 while preserving parity;
 * on devices with it, the f16 coords path runs on the real GPU. Either way
 * the harness must report status=done.
 */
const port = 4410
const dev = spawn(
  '/home/endmin/zenless-optimizer-0delay/node_modules/.bin/vite',
  ['--port', String(port), '--strictPort', '--host', '127.0.0.1'],
  { cwd: '/home/endmin/zenless-optimizer-0delay/app', stdio: 'ignore' }
)
const base = `http://127.0.0.1:${port}/zenless-optimizer-0delay/webgpu-harness.html`
for (let i = 0; i < 90; i++) {
  try {
    const r = await fetch(base)
    if (r.ok) break
  } catch {
    // dev server not up yet — keep polling
  }
  await new Promise((r) => setTimeout(r, 1000))
}
const browser = await chromium.launch({
  executablePath: '/opt/helium-browser-bin/chrome',
  args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=swiftshader'],
})
const page = await browser.newPage()
const consoleLines: string[] = []
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`))
await page.goto(`${base}?f16=1`, { waitUntil: 'domcontentloaded' })
try {
  await page.waitForFunction(
    () =>
      document.body.dataset.status === 'done' ||
      document.body.dataset.status === 'fail',
    { timeout: 120000 }
  )
} catch {
  // timeout waiting for the parity run to finish — read whatever status we got
}
const status = await page.evaluate(() => document.body.dataset.status)
const out = (await page.evaluate(
  () =>
    (document.getElementById('out') as HTMLElement | null)?.textContent ?? ''
)) as string
console.log('STATUS:', status)
console.log('OUT:\n' + out)
console.log(
  'CONSOLE:\n' +
    consoleLines.filter((l) => /f16|fall|error|warn/i.test(l)).join('\n')
)
await browser.close()
dev.kill('SIGKILL')
process.exit(status === 'done' ? 0 : 1)
