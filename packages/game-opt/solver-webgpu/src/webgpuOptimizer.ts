import type { BuildResult, Progress } from '@zenless-optimizer/game-opt/solver'
import type { Candidate, NumTagFree } from '@zenless-optimizer/pando/engine'
import { compileWgsl } from './codegen/compileWgsl'
import { dispatchStartIndices } from './codegen/mixedRadix'
import { FixedSizeNumericMinQueue } from './topK'
import {
  CALIB_CHUNK,
  CYCLES_PER_INVOCATION,
  computeBudgetedChunkSize,
  computeChunkSize,
  createPipeline,
  encodeChunk,
  generateWgsl,
  getWebgpuDevice,
  MAX_CHUNK_MS,
  setParams,
  TARGET_CHUNKS,
  WORKGROUP_SIZE,
  writeCoords,
} from './webgpuInternals'

export interface OptimizationConfig<ID> {
  candidates: Candidate<ID>[][]
  nodes: NumTagFree[]
  minimum: number[]
  topN: number
  setProgress: (progress: Progress) => void
  isAborted: () => boolean
  /**
   * Tuning: threads per workgroup baked into the shader (default `WORKGROUP_SIZE`
   * = 256, the size every WebGPU device supports). Values above the device's
   * `maxComputeWorkgroupSizeX` are clamped down at runtime. Non-finite or < 1
   * values fall back to the default.
   */
  workgroupSize?: number
  /**
   * Tuning: permutations evaluated per invocation (default `CYCLES_PER_INVOCATION`
   * = 256). Non-finite, < 1, or absurdly large values fall back to the default
   * (the shader's `cycleIndex` is u32, so cycles must stay well under ~16M).
   */
  cyclesPerInvocation?: number
  /**
   * Called once at the end with aggregate dispatch timing. `gpuMs` is the
   * wall time from submit to `mapAsync` resolution (the GPU executing the
   * dispatch + final copy). `stallMs` is the CPU readback/heap time — with
   * double-buffered dispatch this OVERLAPS the next chunk's GPU compute, so
   * it is not idle time; `gpuMs / (gpuMs + stallMs)` is a utilization proxy.
   * `chunks` counts every dispatch including overflow revisits.
   */
  onTiming?: (t: { gpuMs: number; stallMs: number; chunks: number }) => void
  /**
   * Store the coords matrix as f16 (half the memory traffic). Only used when
   * the device exposes `shader-f16`; otherwise it silently falls back to f32.
   * Exact for integers up to 2048 (the range ZZZ disc/wengine stats occupy;
   * values in [2048, 4096] are exact only when even), so results match the
   * f32 path for realistic candidate pools.
   */
  f16?: boolean
  /**
   * EXPERIMENTAL: double-buffered dispatch (submit chunk N+1 before reading
   * chunk N). Default OFF — on some drivers the per-chunk `mapAsync`/queue
   * handshake is cheap and back-to-back dispatch contends (or removes the
   * cooling gaps), making the synchronous loop faster. A/B test on your
   * hardware before enabling.
   */
  doubleBuffer?: boolean
  /**
   * Target # of dispatches for the run (default `TARGET_CHUNKS` = 4). The
   * per-chunk submit/mapAsync roundtrip is a fixed cost on most drivers, so
   * fewer, bigger chunks are faster — up to the 2^31 u32 safety ceiling.
   * Tradeoff: when a chunk's compact results overflow, the whole chunk is
   * re-dispatched with a higher threshold, so very low values (1-2) on
   * weakly-constrained configs can re-run the full space several times — if
   * the "compact buffer overflow after N revisits: dropped X builds" warning
   * appears, raise this or tighten filters. Non-finite or < 1 values fall
   * back to the default.
   */
  targetChunks?: number
  /**
   * Per-dispatch GPU-time budget (ms) for Windows TDR safety. Windows'
   * WDDM watchdog (DXGI_ERROR_DEVICE_HUNG) resets the GPU when a single
   * dispatch runs longer than ~2s; Linux has no such watchdog, which is why
   * the same configs crash on Windows but not Linux. On TDR-risk platforms
   * the optimizer calibrates the device's real rate and caps chunk size so
   * no dispatch exceeds this budget. Default `MAX_CHUNK_MS` = 1000
   * (`?chunkms=`). Non-finite/out-of-range values fall back to the default.
   */
  chunkMs?: number
  /**
   * Force (true) or disable (false) the rate calibration that caps chunk
   * size to `chunkMs` of GPU time. Default: enabled on TDR-risk platforms
   * (Windows), disabled elsewhere — Linux machines are faster without the
   * extra calibration dispatches, and have no watchdog to protect against.
   * `?cal=1` / `?cal=0`.
   */
  calibrate?: boolean
}

const f32Scratch = new Float32Array(1)
const u32Scratch = new Uint32Array(f32Scratch.buffer)

function f32Bits(v: number): number {
  f32Scratch[0] = v
  return u32Scratch[0]
}

/**
 * Pack an f32 matrix into IEEE-754 half precision (2 bytes/element — half the
 * memory traffic of f32), round-to-nearest-even per WGSL `f16` semantics.
 * Exact for integers up to 2048 (values in [2048, 4096] only when even), which
 * covers all realistic ZZZ stat values.
 */
export function packF16(src: Float32Array): Uint16Array<ArrayBuffer> {
  const out = new Uint16Array(src.length)
  for (let i = 0; i < src.length; i++) {
    const bits = f32Bits(src[i])
    const sign = (bits >>> 16) & 0x8000
    const exp = (bits >>> 23) & 0xff
    const mant = bits & 0x7fffff
    if (exp === 0xff) {
      // Inf / NaN -> half Inf / quiet NaN
      out[i] = sign | 0x7c00 | (mant ? 0x200 : 0)
      continue
    }
    const halfExp = exp - 127 + 15
    if (halfExp >= 31) {
      out[i] = sign | 0x7c00 // overflow -> Inf
      continue
    }
    if (halfExp <= 0) {
      // subnormal or zero
      if (halfExp < -10) {
        out[i] = sign
        continue
      }
      const m = mant | 0x800000
      const shift = 14 - halfExp
      const half = m >> shift
      const rem = m & ((1 << shift) - 1)
      const halfway = 1 << (shift - 1)
      out[i] =
        sign |
        (rem > halfway || (rem === halfway && (half & 1) === 1)
          ? half + 1
          : half)
      continue
    }
    let half = sign | (halfExp << 10) | (mant >> 13)
    const rem = mant & 0x1fff
    if (rem > 0x1000 || (rem === 0x1000 && (half & 1) === 1)) half += 1
    out[i] = half
  }
  return out
}

/** Max re-dispatch attempts for a chunk whose compact results overflow */
const MAX_REVISITS = 8

/** Upper bound on cycles-per-invocation to keep `indexGlobal * cycles` in u32 range. */
const MAX_CYCLES = 1_000_000

/**
 * Validate tuning inputs. Non-finite, < 1, or (for cycles) absurdly large
 * values fall back to the proven defaults rather than producing an invalid
 * shader or a zero/NaN dispatch.
 */
export function sanitizeTuning(input: {
  workgroupSize?: number
  cyclesPerInvocation?: number
  targetChunks?: number
  chunkMs?: number
}): {
  workgroupSize: number
  cyclesPerInvocation: number
  targetChunks: number
  chunkMs: number
} {
  const wg = input.workgroupSize
  const cycles = input.cyclesPerInvocation
  const chunks = input.targetChunks
  const chunkMs = input.chunkMs
  return {
    workgroupSize:
      Number.isFinite(wg) && wg! >= 1 ? Math.floor(wg!) : WORKGROUP_SIZE,
    cyclesPerInvocation:
      Number.isFinite(cycles) && cycles! >= 1
        ? Math.min(Math.floor(cycles!), MAX_CYCLES)
        : CYCLES_PER_INVOCATION,
    targetChunks:
      Number.isFinite(chunks) && chunks! >= 1
        ? Math.floor(chunks!)
        : TARGET_CHUNKS,
    // Sanity range: [200ms, 1800ms]. Below 200 the roundtrip dominates; above
    // 1800 an explicit override could push a single dispatch past the ~2s
    // Windows TDR watchdog and recreate the very crash this budget prevents
    // (the default 1000ms keeps 2x headroom).
    chunkMs:
      Number.isFinite(chunkMs) && chunkMs! >= 200 && chunkMs! <= 1800
        ? Math.floor(chunkMs!)
        : MAX_CHUNK_MS,
  }
}

/** True on platforms with a Windows-style GPU watchdog (TDR). */
function isTdrRiskPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  // `navigator.userAgentData` (UA Client Hints) is Chromium-only and not in
  // the DOM lib types — read it defensively and fall back to `platform`.
  const uaData = (
    navigator as unknown as {
      userAgentData?: { platform?: string }
    }
  ).userAgentData
  const platform = uaData?.platform ?? navigator.platform ?? ''
  return /win/i.test(platform)
}

function encodeCandidates(candidates: Candidate<string | number>[][]): {
  coords: Float32Array
  coordKeys: string[]
  coordIndex: Map<string, number>
} {
  const keySet = new Set<string>()
  for (const slot of candidates)
    for (const cnd of slot) for (const k in cnd) if (k !== 'id') keySet.add(k)
  const coordKeys = [...keySet]
  const rows = candidates.flat()
  const coords = new Float32Array(rows.length * coordKeys.length)
  // Column-major (SoA): coords[k * rows + row] so the GPU's fastest-varying
  // slot reads contiguous memory across a warp (coalesced).
  for (let k = 0; k < coordKeys.length; k++) {
    for (let r = 0; r < rows.length; r++) {
      const v = (rows[r] as Record<string, unknown>)[coordKeys[k]]
      if (typeof v === 'number') coords[k * rows.length + r] = v
    }
  }
  return {
    coords,
    coordKeys,
    coordIndex: new Map(coordKeys.map((k, i) => [k, i])),
  }
}

export async function optimize<ID>(
  cfg: OptimizationConfig<ID>
): Promise<BuildResult<ID>[]> {
  const { candidates, nodes, minimum, topN, isAborted } = cfg
  const { workgroupSize, cyclesPerInvocation, targetChunks, chunkMs } =
    sanitizeTuning(cfg)

  // Order slots by descending candidate count. Slot 0 is the fastest-varying
  // radix digit (incremented every cycle), so its wrap — the only event that
  // forces the hoisted read bases to be recomputed — is rarest when the
  // largest slot is first. The `read` sums and result decoding are
  // order-independent, so this is transparent to the formula.
  const order = candidates
    .map((_, i) => i)
    .sort((a, b) => candidates[b].length - candidates[a].length)
  const orderedCandidates = order.map((i) => candidates[i])
  const sizes = orderedCandidates.map((c) => c.length)
  const permLimit = sizes.reduce((n, s) => n * s, 1)
  if (permLimit === 0) return []
  if (permLimit > Number.MAX_SAFE_INTEGER)
    throw new Error('too many combinations')
  // One adaptive chunk size for the whole run: target a few dispatches total
  // (the per-chunk roundtrip is a fixed cost), clamped to the u32-safe range.
  // The last chunk is whatever remains of permLimit. May be reduced below on
  // TDR-risk platforms by the calibration below.
  let chunkSize = computeChunkSize(permLimit, targetChunks)

  const {
    coords: allCoords,
    coordKeys,
    coordIndex,
  } = encodeCandidates(orderedCandidates as Candidate<string | number>[][])
  // Per-slot coordinate availability: which keys each slot's candidates carry.
  // The codegen uses this to drop per-cycle loads for coords absent from slot
  // 0 (pure hoisted-base reads) and to skip base recompute for coords confined
  // to slot 0. In the app, wengine coords live only in slot 0 and disc coords
  // only in slots 1..6, so most coords land in one of the two cheap forms.
  const slotCoordKeys = orderedCandidates.map((slot) => {
    const keys = new Set<string>()
    for (const cnd of slot) for (const k in cnd) if (k !== 'id') keys.add(k)
    return [...keys]
  })
  // Decide the coordinate storage type before compiling: the codegen emits
  // `f32(...)` casts and `array<f16>` reads when f16 is active.
  const { device, f16: useF16 } = await getWebgpuDevice(cfg.f16)
  if (cfg.f16 && !useF16)
    console.warn(
      '[solver-webgpu] shader-f16 not supported on this device; using f32 coordinates'
    )
  const generated = compileWgsl(nodes, {
    dynTagCat: 'q',
    slotCount: sizes.length,
    coordKeys,
    f16: useF16,
    slotCoordKeys,
  })
  // Shrink the candidate matrix to only the coordinates referenced by live
  // (non-folded) reads. The codegen indexes `coords` by the live position, so
  // the matrix columns must match `generated.liveCoordKeys` order.
  const rowCount = allCoords.length / coordKeys.length
  const coords = new Float32Array(rowCount * generated.liveCoordKeys.length)
  for (let k = 0; k < generated.liveCoordKeys.length; k++) {
    const src = coordIndex.get(generated.liveCoordKeys[k])!
    for (let r = 0; r < rowCount; r++)
      coords[k * rowCount + r] = allCoords[src * rowCount + r]
  }
  const coordsBytes = useF16 ? packF16(coords) : coords
  const compactLimit = Math.min(Math.max(4096, permLimit), 500_000)
  let effectiveWorkgroup = workgroupSize
  const buildWgsl = (wg: number) =>
    generateWgsl({
      slotCount: sizes.length,
      slotSizes: sizes,
      minimum,
      nodes,
      generated,
      compactLimit,
      workgroupSize: wg,
      cyclesPerInvocation,
      f16: useF16,
    })
  let wgsl = buildWgsl(effectiveWorkgroup)
  // Clamp the workgroup size to what this device actually supports. The spec
  // guarantees 256 everywhere, but larger sizes (512/1024) only work on some
  // devices — and creating an oversized pipeline does NOT throw, it yields a
  // silently invalid pipeline, so clamp up front. For a 1D workgroup the
  // `maxComputeWorkgroupSizeX` dimension limit is the binding constraint
  // (invocations >= X per spec); fall back to the guaranteed 256 if missing.
  const maxWorkgroup = device.limits.maxComputeWorkgroupSizeX ?? 256
  if (effectiveWorkgroup > maxWorkgroup) {
    console.warn(
      `[solver-webgpu] workgroup size ${effectiveWorkgroup} exceeds device limit ${maxWorkgroup}, using ${maxWorkgroup}`
    )
    effectiveWorkgroup = maxWorkgroup
    wgsl = buildWgsl(effectiveWorkgroup)
  }
  // Note: pipeline creation failures (invalid WGSL, unsupported limits) do not
  // throw — they yield a silently invalid pipeline. The clamp above prevents
  // the known cause (oversized workgroup); any residual failure propagates to
  // `WebGpuSolver`, which falls back to the CPU solver.
  const pipeline = createPipeline(
    device,
    wgsl,
    rowCount,
    generated.coordCount,
    compactLimit,
    useF16
  )
  const coveragePerWorkgroup = effectiveWorkgroup * cyclesPerInvocation
  const { buffers } = pipeline
  writeCoords(device, buffers.coords, coordsBytes)

  const bindGroups = [
    device.createBindGroup({
      layout: pipeline.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: buffers.params } }],
    }),
    device.createBindGroup({
      layout: pipeline.pipeline.getBindGroupLayout(1),
      entries: [{ binding: 0, resource: { buffer: buffers.coords } }],
    }),
    device.createBindGroup({
      layout: pipeline.pipeline.getBindGroupLayout(2),
      entries: [
        { binding: 1, resource: { buffer: buffers.compactCount } },
        { binding: 2, resource: { buffer: buffers.compactResults } },
        { binding: 3, resource: { buffer: buffers.validCount } },
      ],
    }),
  ]

  // Heap keeps raw flat permutation indices; slot indices are decoded only
  // for the final top-N, avoiding per-result mixed-radix work in the hot loop.
  const heap = new FixedSizeNumericMinQueue<number>(topN)
  const progress: Progress = {
    computed: 0,
    failed: 0,
    skipped: 0,
    remaining: permLimit,
  }
  let validSeen = 0
  let startIndex = 0
  let nextReport = 0
  let gpuMs = 0
  let stallMs = 0
  let chunks = 0

  const readback = pipeline.readback
  const submitTime: [number, number] = [0, 0]

  const dispatchChunk = (start: number, bufferIndex: 0 | 1, size?: number) => {
    const chunk =
      size !== undefined
        ? Math.min(size, permLimit - start)
        : Math.min(chunkSize, permLimit - start)
    const bases = dispatchStartIndices(start, sizes)
    setParams(device, buffers.params, bases, heap.threshold, chunk)
    const encoder = encodeChunk(
      device,
      pipeline,
      bindGroups,
      Math.ceil(chunk / coveragePerWorkgroup),
      bufferIndex
    )
    device.queue.submit([encoder.finish()])
    submitTime[bufferIndex] = performance.now()
  }

  const processMappedResults = (
    mapped: ArrayBuffer,
    chunkStart: number,
    dedup: boolean,
    seen: Set<number>
  ): { compact: number; valid: number } => {
    const u32 = new Uint32Array(mapped)
    const f32 = new Float32Array(mapped)
    const compact = u32[0]
    const valid = u32[pipeline.validOffset / 4]
    const useDedup = dedup || compact >= compactLimit
    const kept = Math.min(compact, compactLimit)
    if (kept > 0) {
      const base = pipeline.resultsOffset / 4
      for (let e = 0; e < kept; e++) {
        const local = u32[base + e * 2]
        const value = f32[base + e * 2 + 1]
        const flat = chunkStart + local
        if (useDedup) {
          if (seen.has(flat)) continue
          seen.add(flat)
        }
        heap.push(value, flat)
      }
    }
    return { compact, valid }
  }

  // ── Windows TDR safety: calibrate the device's real rate, cap chunks ──
  // Windows' WDDM watchdog (DXGI_ERROR_DEVICE_HUNG) resets the GPU when a
  // single dispatch runs longer than ~2s; Linux has no such watchdog, which
  // is why identical configs crash on Windows but run fine on Linux. The
  // target-chunks sizing can pick multi-second dispatches on slower Windows
  // GPUs (e.g. 8B perms / 4 chunks = 2^31 perms per dispatch), so on
  // TDR-risk platforms we measure the true rate with a back-to-back
  // calibration pair and shrink the chunk size to fit `chunkMs` of GPU time.
  // The pair's results are real work — merged into the heap, not discarded.
  const seen = new Set<number>()
  // Start the db-path wall clock here (before calibration) so its
  // `gpuMs = now - dbStart - stallMs` includes calibration time instead of
  // undercounting by the calibration stall.
  const dbStart = performance.now()
  const tdrRisk = cfg.calibrate ?? isTdrRiskPlatform()
  if (tdrRisk && permLimit > 2 * CALIB_CHUNK) {
    const calib = Math.min(CALIB_CHUNK, permLimit)
    // Two chunks on the two readback buffers, submitted back-to-back: the gap
    // between their mapAsync resolutions is pure GPU time (the fixed
    // submit->mapAsync roundtrip applies to both and cancels out). The
    // dispatch gap floor (5ms) guards against sub-ms timer noise inflating
    // the measured rate; it sits below the gap of even the fastest real GPUs
    // (2^22 perms at 677M/s ≈ 6ms) so it only bites on pathological noise.
    dispatchChunk(0, 0, calib)
    dispatchChunk(calib, 1, calib)
    await readback[0].mapAsync(GPUMapMode.READ)
    const t0 = performance.now()
    await readback[1].mapAsync(GPUMapMode.READ)
    const t1 = performance.now()
    if (isAborted()) return []
    const gapMs = Math.max(5, t1 - t0)
    const ratePerMs = calib / gapMs
    const budgeted = computeBudgetedChunkSize(ratePerMs, chunkMs)
    const capped = Math.min(chunkSize, budgeted)
    if (capped < chunkSize)
      console.info(
        `[solver-webgpu] TDR calibration: ${(ratePerMs * 1000).toFixed(0)}/s -> chunk ${chunkSize} capped to ${capped} (${chunkMs}ms budget)`
      )
    chunkSize = capped
    // wall time from the first submit to the second resolution: roundtrip +
    // both calibration chunks' GPU time (metric only, not used for sizing)
    gpuMs += t1 - submitTime[0]
    chunks += 2
    // Process both calibration chunks' results (with overflow revisits, same
    // as the main loop) so their builds reach the heap.
    for (const [start, buf] of [
      [0, 0],
      [calib, 1],
    ] as const) {
      let attempts = 0
      for (;;) {
        const tMapped = performance.now()
        const counts = processMappedResults(
          readback[buf].getMappedRange(),
          start,
          true,
          seen
        )
        readback[buf].unmap()
        stallMs += performance.now() - tMapped
        validSeen += counts.valid
        if (counts.compact >= compactLimit && attempts < MAX_REVISITS) {
          attempts += 1
          dispatchChunk(start, buf, calib)
          await readback[buf].mapAsync(GPUMapMode.READ)
          continue
        }
        if (counts.compact >= compactLimit)
          console.warn(
            '[solver-webgpu] compact buffer overflow during TDR calibration after',
            attempts,
            'revisits: dropped',
            counts.compact - compactLimit,
            'builds'
          )
        break
      }
    }
    startIndex = 2 * calib
    progress.computed = startIndex
    progress.failed = startIndex - validSeen
    progress.remaining = permLimit - startIndex
  }

  if (cfg.doubleBuffer) {
    // EXPERIMENTAL: submit chunk N+1 before reading chunk N so the mapAsync
    // roundtrip overlaps the next chunk's compute. Off by default — on some
    // drivers the roundtrip is cheap and back-to-back dispatch loses to the
    // synchronous loop (which also keeps small cooling gaps between chunks).
    // Wall time is measured here (submit->mapAsync windows overlap, so a
    // per-window sum would double-count). Overflowed chunks are re-dispatched
    // after the main loop with the risen heap threshold, deduped globally.
    const overflowed: number[] = []
    dispatchChunk(startIndex, 0)
    let readIndex: 0 | 1 = 0
    while (startIndex < permLimit) {
      if (isAborted()) return []
      const chunk = Math.min(chunkSize, permLimit - startIndex)
      const nextStart = startIndex + chunk
      if (nextStart < permLimit)
        dispatchChunk(nextStart, (1 - readIndex) as 0 | 1)
      await readback[readIndex].mapAsync(GPUMapMode.READ)
      const tMapped = performance.now()
      const counts = processMappedResults(
        readback[readIndex].getMappedRange(),
        startIndex,
        false,
        seen
      )
      readback[readIndex].unmap()
      stallMs += performance.now() - tMapped
      chunks += 1
      validSeen += counts.valid
      if (counts.compact >= compactLimit) overflowed.push(startIndex)
      startIndex = nextStart
      progress.computed = startIndex
      progress.failed = startIndex - validSeen
      progress.remaining = permLimit - startIndex
      const now = Date.now()
      if (now >= nextReport) {
        nextReport = now + 50
        cfg.setProgress({ ...progress })
      }
      readIndex = (1 - readIndex) as 0 | 1
    }
    for (const start of overflowed) {
      if (isAborted()) return []
      let attempts = 0
      let counts: { compact: number; valid: number }
      for (;;) {
        if (isAborted()) return []
        chunks += 1
        dispatchChunk(start, 0)
        await readback[0].mapAsync(GPUMapMode.READ)
        const tMapped = performance.now()
        counts = processMappedResults(
          readback[0].getMappedRange(),
          start,
          true,
          seen
        )
        readback[0].unmap()
        stallMs += performance.now() - tMapped
        if (counts.compact < compactLimit || attempts >= MAX_REVISITS) break
        attempts += 1
      }
      validSeen += counts.valid
      if (counts.compact >= compactLimit)
        console.warn(
          '[solver-webgpu] compact buffer overflow after',
          attempts,
          'revisits: dropped',
          counts.compact - compactLimit,
          'builds in this chunk'
        )
    }
    gpuMs = performance.now() - dbStart - stallMs
  } else {
    // Synchronous per-chunk dispatch (proven default): submit, drain via
    // `mapAsync`, process, then dispatch the next chunk. The submit->mapAsync
    // window measures exactly one chunk's GPU time (no overlap), so gpuMs is
    // trustworthy. Overflowed chunks are immediately re-dispatched with the
    // rising heap threshold until they fit, deduped by the shared `seen` set.
    while (startIndex < permLimit) {
      if (isAborted()) return []
      const chunk = Math.min(chunkSize, permLimit - startIndex)
      let attempts = 0
      let counts: { compact: number; valid: number }
      for (;;) {
        dispatchChunk(startIndex, 0)
        await readback[0].mapAsync(GPUMapMode.READ)
        const tMapped = performance.now()
        gpuMs += tMapped - submitTime[0]
        counts = processMappedResults(
          readback[0].getMappedRange(),
          startIndex,
          true,
          seen
        )
        readback[0].unmap()
        stallMs += performance.now() - tMapped
        if (counts.compact >= compactLimit && attempts < MAX_REVISITS) {
          attempts += 1
          continue
        }
        break
      }
      chunks += 1
      if (counts.compact >= compactLimit)
        console.warn(
          '[solver-webgpu] compact buffer overflow after',
          attempts,
          'revisits: dropped',
          counts.compact - compactLimit,
          'builds in this chunk'
        )
      validSeen += counts.valid
      startIndex += chunk
      progress.computed = startIndex
      progress.failed = startIndex - validSeen
      progress.remaining = permLimit - startIndex
      const now = Date.now()
      if (now >= nextReport) {
        nextReport = now + 50
        cfg.setProgress({ ...progress })
      }
    }
  }
  cfg.setProgress({ ...progress })
  const timing = { gpuMs, stallMs, chunks }
  if (cfg.onTiming) cfg.onTiming(timing)
  // With double-buffered dispatch the CPU readback overlaps the next
  // chunk's GPU compute, so `stallMs` is overlapped work, not idle time.
  else
    console.info(
      `[solver-webgpu] gpu busy ${(gpuMs / (gpuMs + stallMs)) * 100}% of solver loop (${gpuMs.toFixed(0)}ms gpu vs ${stallMs.toFixed(0)}ms overlapped readback, ${chunks} dispatch(es))`
    )
  return heap.toEntries().map(({ value, item: flat }) => {
    const indices = dispatchStartIndices(flat, sizes)
    // Restore the caller's original slot order (results are decoded in the
    // size-sorted internal order).
    const ids = new Array<ID>(order.length)
    for (let s = 0; s < order.length; s++)
      ids[order[s]] = orderedCandidates[s][indices[s]].id
    return { value, ids }
  })
}
