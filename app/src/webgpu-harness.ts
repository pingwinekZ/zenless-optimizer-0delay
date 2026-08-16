import type { Candidate } from '@zenless-optimizer/game-opt/solver'
import {
  dispatchStartIndices,
  optimize,
} from '@zenless-optimizer/game-opt/solver-webgpu'
import type { NumTagFree } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
  compile,
  constant,
  max,
  prod,
  prune,
  read,
  sum,
  sumfrac,
} from '@zenless-optimizer/pando/engine'

const statusEl = document.getElementById('status')!
const outEl = document.getElementById('out')!

function log(line: unknown) {
  outEl.textContent +=
    typeof line === 'string' ? `${line}\n` : `${JSON.stringify(line)}\n`
}

function setStatus(status: string, detail?: unknown) {
  statusEl.textContent = status
  document.body.dataset.status = status
  if (detail) log(detail)
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STAT_KEYS = [
  'atk_',
  'crit_',
  'crit_dmg_',
  'atk_pct_',
  'dmg_',
  'pen_',
  'anom_',
]

async function bench(
  slotSizes: number[],
  tuning?: {
    workgroupSize?: number
    cyclesPerInvocation?: number
    f16?: boolean
    doubleBuffer?: boolean
    targetChunks?: number
    chunkMs?: number
    calibrate?: boolean
  }
) {
  const rng = mulberry32(7)
  const candidates: Candidate<string>[][] = slotSizes.map((size, s) =>
    [...Array(size)].map((_, i) => {
      const cnd = {
        id: `c${s}_${i}`,
        setA: 1,
        setB: 0,
        setC: 0,
      } as unknown as Candidate<string>
      for (const key of STAT_KEYS) cnd[key] = Math.floor(rng() * 60)
      return cnd as Candidate<string>
    })
  )
  const perm = slotSizes.reduce((n, s) => n * s, 1)
  const nodes: NumTagFree[] = [
    sum(
      prod(constant(1.2), read({ q: 'atk_' })),
      read({ q: 'crit_' }),
      read({ q: 'crit_dmg_' }),
      sumfrac(read({ q: 'anom_' }), constant(1)),
      max(read({ q: 'dmg_' }), read({ q: 'pen_' }), constant(5))
    ),
    cmpGE(read({ q: 'atk_pct_' }), constant(10), constant(1), constant(0)),
  ]
  const topN = 1024
  log(
    `bench: ${slotSizes.join('x')} = ${perm} perms, topN ${topN}, wg=${tuning?.workgroupSize ?? 256}, cycles=${tuning?.cyclesPerInvocation ?? 256}, f16=${tuning?.f16 ? 1 : 0}, db=${tuning?.doubleBuffer ? 1 : 0}, chunks=${tuning?.targetChunks ?? 4}`
  )
  const t0 = performance.now()
  const results = await optimize({
    candidates,
    nodes,
    minimum: [-Infinity, 1],
    topN,
    setProgress: () => undefined,
    isAborted: () => false,
    onTiming: (t) =>
      log(
        `gpu busy: ${((t.gpuMs / (t.gpuMs + t.stallMs)) * 100).toFixed(1)}% of solver loop (${t.gpuMs.toFixed(0)}ms gpu vs ${t.stallMs.toFixed(0)}ms cpu-stall, ${t.chunks} dispatch(es))`
      ),
    ...tuning,
  })
  const ms = performance.now() - t0
  log(
    `bench done: ${ms.toFixed(0)}ms, ${(perm / ms).toFixed(0)} /sec, ${results.length} results, best=${results[0]?.value}`
  )
  setStatus('done', { perm, ms, rate: perm / ms, results: results.length })
}

async function main() {
  if (!('gpu' in navigator)) {
    setStatus('no-webgpu', 'navigator.gpu unavailable')
    return
  }

  const params = new URLSearchParams(window.location.search)
  const tuning = {
    ...(params.get('wg') ? { workgroupSize: Number(params.get('wg')) } : {}),
    ...(params.get('cycles')
      ? { cyclesPerInvocation: Number(params.get('cycles')) }
      : {}),
    ...(params.get('f16') ? { f16: params.get('f16') === '1' } : {}),
    ...(params.get('db') ? { doubleBuffer: params.get('db') === '1' } : {}),
    ...(params.get('chunks')
      ? { targetChunks: Number(params.get('chunks')) }
      : {}),
    ...(params.get('chunkms')
      ? { chunkMs: Number(params.get('chunkms')) }
      : {}),
    ...(params.get('cal') ? { calibrate: params.get('cal') === '1' } : {}),
  }
  const benchParam = params.get('bench')
  if (benchParam) {
    await bench(
      benchParam.split(',').map((s) => Number(s)),
      tuning
    )
    return
  }
  const sizesParam = params.get('sizes')
  if (sizesParam) log(`parity sizes: ${sizesParam}`)

  const rng = mulberry32(42)
  const slotSizes = sizesParam
    ? sizesParam.split(',').map((s) => Number(s))
    : [4, 5, 6, 3, 4, 5, 6]
  const candidates: Candidate<string>[][] = slotSizes.map((size, s) =>
    [...Array(size)].map((_, i) => {
      const cnd = {
        id: `c${s}_${i}`,
        setA: rng() < 0.5 ? 1 : 0,
        setB: rng() < 0.5 ? 1 : 0,
        setC: rng() < 0.5 ? 1 : 0,
      } as unknown as Candidate<string>
      for (const key of STAT_KEYS) {
        if (rng() < 0.25) continue // exercise the missing-key -> 0 path
        cnd[key] = Math.floor(rng() * 60)
      }
      return cnd as Candidate<string>
    })
  )

  const nodes: NumTagFree[] = [
    sum(
      prod(constant(1.2), read({ q: 'atk_' })),
      read({ q: 'crit_' }),
      read({ q: 'crit_dmg_' }),
      sumfrac(read({ q: 'anom_' }), constant(1)),
      max(read({ q: 'dmg_' }), read({ q: 'pen_' }), constant(5)),
      // Dead terms: constant-folded by the WGSL codegen (missing coordinate +
      // zero product). The CPU reference evaluates them to 0 as well, so
      // parity must hold on the real GPU pipeline.
      prod(constant(0), read({ q: 'atk_' })),
      read({ q: 'not_in_pool' })
    ),
    sum(read({ q: 'crit_' }), read({ q: 'crit_dmg_' })),
    cmpGE(read({ q: 'atk_pct_' }), constant(10), constant(1), constant(0)),
  ]
  const minimum = [-Infinity, 30, 1]
  const topN = 50

  log({ slotSizes, perm: slotSizes.reduce((n, s) => n * s, 1) })

  // ---- CPU reference: pando `compile` (independent of the WGSL path) ----
  const cpuStart = performance.now()
  const pruned = prune(nodes, candidates, 'q', minimum, topN)
  const refFn = compile(pruned.nodes, 'q', pruned.candidates.length)
  const sizes = pruned.candidates.map((c) => c.length)
  const permCpu = sizes.reduce((n, s) => n * s, 1)
  log(
    `prune: ${slotSizes.reduce((n, s) => n * s, 1)} -> ${permCpu} builds (topN ${topN})`
  )

  const best: { value: number; ids: string[] }[] = []
  const pushBest = (value: number, ids: string[]) => {
    if (best.length < topN) {
      best.push({ value, ids })
      best.sort((a, b) => b.value - a.value)
      return
    }
    if (value <= best[best.length - 1].value) return
    best[best.length - 1] = { value, ids }
    best.sort((a, b) => b.value - a.value)
  }
  for (let g = 0; g < permCpu; g++) {
    const idx = dispatchStartIndices(g, sizes)
    const [objective, ...rest] = refFn(
      idx.map((i, s) => pruned.candidates[s][i])
    )
    if (!Number.isFinite(objective)) continue
    let pass = true
    for (let c = 0; c < rest.length; c++) {
      if (rest[c] < pruned.minimum[c + 1]) {
        pass = false
        break
      }
    }
    if (!pass) continue
    pushBest(
      objective,
      idx.map((i, s) => String(pruned.candidates[s][i].id))
    )
  }
  log(
    `cpu reference finished in ${Math.round(performance.now() - cpuStart)}ms, ${best.length} results`
  )

  // ---- GPU: real WebGPU dispatch ----
  const progressLog: string[] = []
  const gpuStart = performance.now()
  const results = await optimize({
    candidates: pruned.candidates,
    nodes: pruned.nodes,
    minimum: pruned.minimum,
    topN,
    setProgress: (p) => progressLog.push(JSON.stringify(p)),
    isAborted: () => false,
    onTiming: (t) =>
      log(
        `gpu busy: ${((t.gpuMs / (t.gpuMs + t.stallMs)) * 100).toFixed(1)}% of solver loop (${t.gpuMs.toFixed(0)}ms gpu vs ${t.stallMs.toFixed(0)}ms cpu-stall, ${t.chunks} dispatch(es))`
      ),
    ...tuning,
  })
  const gpuMs = Math.round(performance.now() - gpuStart)
  log(`gpu: ${gpuMs}ms, ${results.length} results`)
  if (progressLog.length) log(`gpu progress: ${progressLog[0]} ...`)

  // ---- compare ----
  const cpuIds = best.map((b) => b.ids.join('/'))
  const gpuIds = results.map((r) => (r.ids as (string | number)[]).join('/'))
  let maxDiff = 0
  let ok = cpuIds.length === gpuIds.length
  for (let i = 0; i < Math.min(cpuIds.length, gpuIds.length); i++) {
    const cv = best[i]?.value ?? -Infinity
    const gv = results[i]?.value ?? -Infinity
    maxDiff = Math.max(maxDiff, Math.abs(cv - gv))
    if (cpuIds[i] !== gpuIds[i]) {
      ok = false
      log(`build[${i}] ids differ: cpu=${cpuIds[i]} gpu=${gpuIds[i]}`)
    }
  }
  if (!ok) {
    setStatus('fail', {
      cpu: best.slice(0, 10),
      gpu: results.slice(0, 10),
      maxDiff,
    })
    return
  }
  log(`parity: ids match (${cpuIds.length}), max value diff=${maxDiff}`)
  setStatus('done', { cpu: best.slice(0, 3), gpu: results.slice(0, 3) })
}

main().catch((err) => {
  log(`unhandled: ${err?.stack ?? err}`)
  setStatus('fail', String(err))
})
