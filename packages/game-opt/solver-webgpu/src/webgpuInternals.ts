import type { NumTagFree } from '@zenless-optimizer/pando/engine'
import {
  f32Literal,
  generateConstraintFilter,
  generateIndexDecode,
  generateObjectiveFilter,
  type WgslCompileResult,
} from './codegen/compileWgsl'
import computeShader from './wgsl/computeShader.wgsl?raw'
import structs from './wgsl/structs.wgsl?raw'

/** Default threads per workgroup. 256 is the size WebGPU guarantees on every device (and what the HSR solver uses). */
export const WORKGROUP_SIZE = 256
/** Default loop iterations (permutations) per invocation; larger amortizes per-thread setup. */
export const CYCLES_PER_INVOCATION = 256
/**
 * Hard safety ceiling for a single chunk (one submit + one `mapAsync`
 * roundtrip). The shader computes `cycleIndex = indexGlobal *
 * CYCLES_PER_INVOCATION` and iterates while `cycleIndex + i < permLimit` —
 * both u32, so a chunk of 2^32 would wrap `cycleIndex` and spuriously
 * re-enter the loop. capping at 2^31 keeps `cycleIndex + i` under
 * chunk + wg*cycles (≤ ~2^31 + 1e9 for realistic tuning: workgroup ≤ ~1024,
 * cycles ≤ 1e6), comfortably inside u32 — and keeps the dispatch on a
 * single workgroup axis (2^31 / (256*256) = 2^15 workgroups < 65,535), so
 * `workgroup_index = workgroup_id.x` can't wrap either.
 */
// Note: `2 ** 31`, not `1 << 31` — the latter overflows into the sign bit
// in JS and yields a negative constant.
export const MAX_CHUNK = 2 ** 31
/**
 * Smallest chunk the adaptive sizing will pick, so small permutation counts
 * still complete in one dispatch instead of dozens of roundtrips.
 */
export const MIN_CHUNK = 1 << 25
/**
 * Per-dispatch GPU-time budget (ms) for Windows TDR safety. Windows' WDDM
 * watchdog resets the device when a single dispatch runs longer than ~2s
 * (DXGI_ERROR_DEVICE_HUNG); Linux has no such watchdog. The calibration in
 * `webgpuOptimizer` measures the device's real rate and caps chunk size so
 * no dispatch exceeds this budget — 1s leaves 2x headroom under the default
 * TDR timeout. Override with `?chunkms=`.
 */
export const MAX_CHUNK_MS = 1000
/**
 * Size of the two back-to-back calibration chunks used to measure the
 * device's pure GPU rate before the main sweep. Small enough that even a
 * weak Windows GPU finishes each in well under the TDR window (8.4M perms at
 * even 8M/s = ~1s), large enough that the measured resolution gap is well
 * above timer noise on fast GPUs.
 */
export const CALIB_CHUNK = 1 << 22
/** Floor for the time-budgeted chunk size (guards against degenerate rates). */
const MIN_BUDGET_CHUNK = 1 << 18

/**
 * Cap a chunk size to the TDR time budget: `ratePerMs` (perms/ms, measured by
 * calibration) x `chunkMs` (ms) = max perms per dispatch, clamped to
 * [MIN_BUDGET_CHUNK, MAX_CHUNK]. Always safe to apply on top of the
 * target-based sizing (it only ever shrinks chunks).
 */
export function computeBudgetedChunkSize(
  ratePerMs: number,
  chunkMs: number
): number {
  return Math.min(
    MAX_CHUNK,
    Math.max(MIN_BUDGET_CHUNK, Math.floor(ratePerMs * chunkMs))
  )
}
/**
 * Target # of dispatches per solver run. Mirrors the HSR solver's
 * TARGET_ITERATIONS = 4: the per-chunk submit/mapAsync roundtrip is a fixed
 * cost (100-200ms on some drivers), so fewer, bigger chunks win — up to the
 * 2^31 ceiling above.
 */
export const TARGET_CHUNKS = 4
/** WebGPU max compute workgroups per dispatch axis */
const MAX_NUM_GROUPS_PER_AXIS = 65_535

/**
 * Adaptive chunk size: aim for `TARGET_CHUNKS` dispatches across the whole
 * permutation space, clamped to [MIN_CHUNK, MAX_CHUNK]. Bigger runs get
 * bigger chunks automatically (no manual constant edits); the last chunk is
 * whatever remains of `permLimit`. `targetChunks` lets you override the
 * target (e.g. `?chunks=2`); it is sanitized by the caller.
 */
export function computeChunkSize(
  permLimit: number,
  targetChunks: number
): number {
  return Math.min(
    MAX_CHUNK,
    Math.max(MIN_CHUNK, Math.ceil(permLimit / targetChunks))
  )
}

export function dispatchWorkgroups(
  groupCount: number
): [number, number, number] {
  const x = Math.min(MAX_NUM_GROUPS_PER_AXIS, groupCount)
  const y = Math.ceil(groupCount / MAX_NUM_GROUPS_PER_AXIS)
  return [x, y, 1]
}

export interface WebgpuDevice {
  device: GPUDevice
  /** true when the coords matrix is stored as `array<f16>` (shader-f16 feature) */
  f16: boolean
}

let f32DevicePromise: Promise<WebgpuDevice> | undefined
let f16DevicePromise: Promise<WebgpuDevice> | undefined

/**
 * Lazily create (and cache) a WebGPU device. When `preferF16` is set and the
 * adapter exposes `shader-f16`, the device is requested with that feature and
 * `f16: true` is returned so the caller can pack the coords matrix as half
 * floats. Falls back to a plain f32 device (with `f16: false`) when the
 * feature is missing or `preferF16` is unset.
 */
export function getWebgpuDevice(preferF16 = false): Promise<WebgpuDevice> {
  if (preferF16 && f16DevicePromise) return f16DevicePromise
  if (!preferF16 && f32DevicePromise) return f32DevicePromise
  if (!('gpu' in navigator))
    return Promise.reject(new Error('WebGPU is not supported in this browser'))
  const create = (async (): Promise<WebgpuDevice> => {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    })
    if (!adapter) throw new Error('WebGPU: no adapter available')
    if (preferF16 && adapter.features.has('shader-f16')) {
      const device = await adapter.requestDevice({
        requiredFeatures: ['shader-f16'],
      })
      device.lost.then((info) => {
        f16DevicePromise = undefined
        if (info.reason !== 'destroyed')
          console.error('[solver-webgpu] device lost:', info.message)
      })
      return { device, f16: true }
    }
    const device = await adapter.requestDevice()
    device.lost.then((info) => {
      f32DevicePromise = undefined
      f16DevicePromise = undefined
      if (info.reason !== 'destroyed')
        console.error('[solver-webgpu] device lost:', info.message)
    })
    return { device, f16: false }
  })()
  if (preferF16) {
    f16DevicePromise = create
    // The f16 request may have fallen back to a plain f32 device — reuse it
    // for non-f16 callers instead of creating a second device from the same
    // adapter (which could even pick a different adapter on multi-GPU).
    void create.then((d) => {
      if (!d.f16 && !f32DevicePromise) f32DevicePromise = create
    })
  } else {
    f32DevicePromise = create
  }
  return create
}

export interface GenerateWgslParams {
  slotCount: number
  slotSizes: number[]
  minimum: number[]
  nodes: NumTagFree[]
  generated: WgslCompileResult
  compactLimit: number
  /** threads per workgroup baked into `@workgroup_size`; default `WORKGROUP_SIZE` */
  workgroupSize?: number
  /** loop iterations per invocation baked into the shader; default `CYCLES_PER_INVOCATION` */
  cyclesPerInvocation?: number
  /** store the coords matrix as `array<f16>` (requires `shader-f16`) */
  f16?: boolean
}

/**
 * Assemble the full compute shader: shared structs, settings constants
 * (`size{slot}`, `f{slot}`, `q`), and the compiled node graph sections.
 */
export function generateWgsl(p: GenerateWgslParams): string {
  const { generated, slotCount, slotSizes, minimum, nodes } = p
  // The objective is normally dynamic; if it folded to a constant the
  // threshold check still works against the literal value.
  const foldedObjective = generated.folded.get(nodes[0])
  const objectiveVar =
    foldedObjective !== undefined
      ? f32Literal(foldedObjective)
      : generated.names.get(nodes[0])
  if (!objectiveVar)
    throw new Error('GPU solver: objective node missing from codegen')

  let cumulative = 0
  const slotOffsets = p.slotSizes.map((size) => {
    const offset = cumulative
    cumulative += size
    return offset
  })

  // Column-major layout: `rows` = total # of candidate rows; a coordinate
  // `k` of row `r` lives at `coords[k * rows + r]`.
  const rows = slotSizes.reduce((n, s) => n + s, 0)
  const settings = [
    `const rows = ${rows}u;`,
    ...slotSizes.map((size, s) => `const size${s} = ${size}u;`),
    ...slotOffsets.map((offset, s) => `const f${s} = ${offset}u;`),
  ].join('\n')

  let shader = `${structs}${computeShader}`
  // The bind group/binding attributes are part of the declaration and must
  // survive injection (bind group 1 binds the coords matrix).
  shader = shader.replace(
    '/* INJECT COORDS */',
    p.f16
      ? '@group(1) @binding(0) var<storage, read> coords : array<f16>;'
      : '@group(1) @binding(0) var<storage, read> coords : array<f32>;'
  )
  shader = shader.replace('/* INJECT SETTINGS */', settings)
  shader = shader.replace('/* INJECT PRELUDE */', generated.prelude)
  // Constraint subtrees first, then the cheap early-out filter, then the
  // (larger) objective subtree. Builds failing a constraint skip the
  // objective evaluation entirely.
  shader = shader.replace(
    '/* INJECT EVAL CONSTRAINTS */',
    generated.evalConstraints
  )
  shader = shader.replace(
    '/* INJECT FILTER CONSTRAINTS */',
    generateConstraintFilter(minimum, generated.names, generated.folded, nodes)
  )
  shader = shader.replace(
    '/* INJECT EVAL OBJECTIVE */',
    generated.evalObjective
  )
  const decode = generateIndexDecode(slotCount, generated.readBaseUpdate)
  shader = shader.replace('/* INJECT INDEX DECODE */', decode.init)
  shader = shader.replace('/* INJECT READ BASE */', generated.readBaseInit)
  shader = shader.replace('/* INJECT INDEX CARRY */', decode.carry)
  shader = shader.replace(
    '/* INJECT FILTER */',
    generateObjectiveFilter(objectiveVar)
  )
  shader = shader.replaceAll(
    'WORKGROUP_SIZE',
    String(p.workgroupSize ?? WORKGROUP_SIZE)
  )
  shader = shader.replaceAll(
    'CYCLES_PER_INVOCATION',
    String(p.cyclesPerInvocation ?? CYCLES_PER_INVOCATION)
  )
  shader = shader.replaceAll('COMPACT_LIMIT', String(p.compactLimit))
  return shader
}

export interface WgpuBuffers {
  coords: GPUBuffer
  params: GPUBuffer
  compactCount: GPUBuffer
  compactResults: GPUBuffer
  validCount: GPUBuffer
}

export interface WgpuPipeline {
  pipeline: GPUComputePipeline
  buffers: WgpuBuffers
  compactLimit: number
  /**
   * Two merged readback buffers for double-buffered dispatch: while chunk
   * N's results are mapped and read on one, chunk N+1 is already running and
   * copies into the other. Layout per buffer: `[compactCount: u32][CompactEntry
   * × compactLimit][validCount: u32]`, copied from the GPU buffers in the same
   * command encoder as the dispatch, so one `mapAsync` returns everything.
   */
  readback: [GPUBuffer, GPUBuffer]
  /** byte offset of the compact results within each readback buffer */
  resultsOffset: number
  /** byte offset of the valid counter within each readback buffer */
  validOffset: number
}

const pipelineCache = new Map<string, GPUComputePipeline>()

/**
 * Create the compute pipeline and all GPU buffers.
 *
 * @param candidates # of candidate rows in the flattened matrix
 * @param coordCount # of columns (coordinate keys)
 * @param compactLimit max # of compacted results the shader may emit; must
 * match the `COMPACT_LIMIT` baked into the WGSL
 */
export function createPipeline(
  device: GPUDevice,
  wgsl: string,
  candidates: number,
  coordCount: number,
  compactLimit: number,
  f16 = false
): WgpuPipeline {
  let pipeline = pipelineCache.get(wgsl)
  if (!pipeline) {
    const module = device.createShaderModule({ code: wgsl })
    pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    })
    pipelineCache.set(wgsl, pipeline)
  }

  const buffers: WgpuBuffers = {
    // f16 elements are 2 bytes each; round the buffer up to a multiple of 4
    coords: device.createBuffer({
      size: f16
        ? Math.max(4, Math.ceil((candidates * coordCount * 2) / 4) * 4)
        : Math.max(4, candidates * coordCount * 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    params: device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
    compactCount: device.createBuffer({
      size: 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    }),
    compactResults: device.createBuffer({
      size: compactLimit * 8,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    }),
    validCount: device.createBuffer({
      size: 4,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    }),
  }
  const resultsOffset = 4
  const validOffset = 4 + compactLimit * 8
  const readbackSize = validOffset + 4
  const readback: [GPUBuffer, GPUBuffer] = [
    device.createBuffer({
      size: readbackSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    }),
    device.createBuffer({
      size: readbackSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    }),
  ]
  return {
    pipeline,
    buffers,
    compactLimit,
    readback,
    resultsOffset,
    validOffset,
  }
}

export function setParams(
  device: GPUDevice,
  buffer: GPUBuffer,
  bases: number[],
  threshold: number,
  permLimit: number
) {
  const data = new ArrayBuffer(48)
  const floats = new Float32Array(data)
  floats.set(bases)
  floats[7] = threshold
  new Uint32Array(data)[8] = permLimit
  device.queue.writeBuffer(buffer, 0, data)
}

/**
 * Build the per-chunk command encoder: zero the compact/valid counters with
 * `clearBuffer` (no separate queue roundtrip), run the dispatch, and copy
 * count + results + valid counter into `readback[bufferIndex]`. The compact
 * results buffer is shared between the two in-flight chunks — the queue
 * executes each chunk's [clear, dispatch, copy] in order, so a later chunk's
 * clear can never race an earlier chunk's copy. Callers submit once, then map
 * `pipeline.readback[bufferIndex]`.
 */
export function encodeChunk(
  device: GPUDevice,
  pipeline: WgpuPipeline,
  bindGroups: GPUBindGroup[],
  groupCount: number,
  bufferIndex: 0 | 1 = 0
): GPUCommandEncoder {
  const { buffers, readback, compactLimit, resultsOffset, validOffset } =
    pipeline
  const encoder = device.createCommandEncoder()
  encoder.clearBuffer(buffers.compactCount, 0, 4)
  encoder.clearBuffer(buffers.validCount, 0, 4)

  const pass = encoder.beginComputePass()
  pass.setPipeline(pipeline.pipeline)
  for (let g = 0; g < bindGroups.length; g++)
    pass.setBindGroup(g, bindGroups[g])
  const [dx, dy, dz] = dispatchWorkgroups(groupCount)
  pass.dispatchWorkgroups(dx, dy, dz)
  pass.end()

  const dst = readback[bufferIndex]
  encoder.copyBufferToBuffer(buffers.compactCount, 0, dst, 0, 4)
  encoder.copyBufferToBuffer(
    buffers.compactResults,
    0,
    dst,
    resultsOffset,
    compactLimit * 8
  )
  encoder.copyBufferToBuffer(buffers.validCount, 0, dst, validOffset, 4)
  return encoder
}

export function writeCoords(
  device: GPUDevice,
  buffer: GPUBuffer,
  coords: BufferSource
) {
  device.queue.writeBuffer(buffer, 0, coords)
}
