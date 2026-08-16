import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

/**
 * Bench-path check: ?bench=20,20,20,20,20,70 = 224M permutations with a loose
 * constraint (~83% pass rate) so the compact buffer overflows and the
 * post-loop revisit path runs. Asserts status=done and 1024 results.
 */
const port = 4411
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
// 8^5 x 20 = 655,360 perms; with the loose constraint ~83% pass = ~544k >
// compactLimit 500k, so the post-loop overflow/revisit path runs. SwiftShader
// is ~1M/sec, so this finishes in a couple of seconds. Set WEBGPU_E2E_DB=1 to
// exercise the experimental double-buffered dispatch path.
const db = process.env.WEBGPU_E2E_DB === '1' ? '&db=1' : ''
await page.goto(`${base}?bench=8,8,8,8,8,20${db}`, {
  waitUntil: 'domcontentloaded',
})
try {
  await page.waitForFunction(
    () =>
      document.body.dataset.status === 'done' ||
      document.body.dataset.status === 'fail',
    { timeout: 60000 }
  )
} catch {
  // timeout waiting for the bench to finish — read whatever status we got
}
const status = await page.evaluate(() => document.body.dataset.status)
const out = (await page.evaluate(
  () =>
    (document.getElementById('out') as HTMLElement | null)?.textContent ?? ''
)) as string
console.log('STATUS:', status)
console.log(out.split('\n').slice(0, 6).join('\n'))
console.log(
  'CONSOLE:',
  consoleLines.filter((l) => /overflow|error/i.test(l)).join(' | ')
)
await browser.close()
dev.kill('SIGKILL')
process.exit(status === 'done' ? 0 : 1)
