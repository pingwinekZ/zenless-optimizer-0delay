import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Browser, chromium, type Page } from 'playwright'

/**
 * End-to-end GPU/CPU parity check for the WebGPU solver.
 *
 * Serves the app via Vite, loads `webgpu-harness.html` in headless Chromium
 * with WebGPU enabled, and asserts the harness reports `data-status="done"`
 * (identical top-N build ids on GPU vs CPU within f32 tolerance).
 *
 * Usage:
 *   bun run app/tests/playwright/webgpu-e2e.ts
 * Env:
 *   GPU_CHROME_EXECUTABLE  path to a chromium binary (defaults to the
 *                          helium-browser chromium at /opt/helium-browser-bin/chrome)
 *   WEBGPU_E2E_URL         pre-served harness URL (skips starting the dev server)
 *   WEBGPU_E2E_PORT        dev server port (default 4321)
 */

const appDir = fileURLToPath(new URL('../../', import.meta.url))
const viteBin = fileURLToPath(
  new URL('../../../node_modules/.bin/vite', import.meta.url)
)

const HELIUM_CHROME = '/opt/helium-browser-bin/chrome'
const HARNESS_PATH = '/zenless-optimizer-0delay/webgpu-harness.html'
const PARITY_RE = /parity: ids match \((\d+)\), max value diff=([0-9.eE+-]+)/
const TOLERANCE = 1e-2

function spawnDevServer(port: number): ChildProcess {
  const child = spawn(
    viteBin,
    ['--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { cwd: appDir, stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let stderr = ''
  child.stderr?.on('data', (d: Buffer) => (stderr += d.toString()))
  return Object.assign(child, { __stderr: () => stderr })
}

async function waitForServer(child: ChildProcess, url: string): Promise<void> {
  const deadline = Date.now() + 90_000
  for (;;) {
    if (child.exitCode !== null)
      throw new Error(`vite exited early (code ${child.exitCode})`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not ready yet */
    }
    if (Date.now() > deadline)
      throw new Error(
        `timed out waiting for dev server:\n${child.stderr?.toString() ?? ''}`
      )
    await new Promise((r) => setTimeout(r, 1000))
  }
}

function resolveChrome(): string | undefined {
  const explicit = process.env.GPU_CHROME_EXECUTABLE
  if (explicit && existsSync(explicit)) return explicit
  if (existsSync(HELIUM_CHROME)) return HELIUM_CHROME
  return undefined
}

async function run(
  url: string,
  browser: Browser,
  page: Page
): Promise<{ status: string; out: string }> {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForFunction(
    () => document.body.dataset.status !== 'running',
    undefined,
    { timeout: 90_000 }
  )
  const status = await page.evaluate(() => document.body.dataset.status)
  const out = (await page.evaluate(
    () =>
      (document.getElementById('out') as HTMLElement | null)?.textContent ?? ''
  )) as string
  if (status !== 'done') {
    throw new Error(
      `harness status=${status}\n${out}\nconsole errors:\n${consoleErrors.join('\n')}`
    )
  }
  return { status, out }
}

async function main() {
  const port = Number(process.env.WEBGPU_E2E_PORT ?? 4321)
  const baseUrl = process.env.WEBGPU_E2E_URL
  const url = `${baseUrl ?? `http://127.0.0.1:${port}`}${HARNESS_PATH}`

  const dev = baseUrl ? undefined : spawnDevServer(port)
  if (dev) await waitForServer(dev, url)

  const browser = await chromium.launch({
    executablePath: resolveChrome(),
    args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=swiftshader'],
  })

  try {
    const page = await browser.newPage()
    const { out } = await run(url, browser, page)
    const match = PARITY_RE.exec(out)
    if (!match) throw new Error(`parity line missing:\n${out}`)
    const count = Number(match[1])
    const maxDiff = Number(match[2])
    if (count < 1) throw new Error(`unexpected result count ${count}`)
    if (!Number.isFinite(maxDiff) || maxDiff > TOLERANCE) {
      throw new Error(
        `value divergence ${maxDiff} exceeds tolerance ${TOLERANCE}`
      )
    }
    console.log(
      `WEBGPU-E2E OK ${count} builds, max value diff ${maxDiff} (f32 tolerance ${TOLERANCE})`
    )
  } finally {
    await browser.close()
    dev?.kill('SIGKILL')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
