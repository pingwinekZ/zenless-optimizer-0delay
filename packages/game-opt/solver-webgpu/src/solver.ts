import type { Progress } from '@zenless-optimizer/game-opt/solver'
import {
  type BuildResult,
  buildCount,
  Solver,
  type SolverConfig,
} from '@zenless-optimizer/game-opt/solver'
import type { Candidate, NumTagFree } from '@zenless-optimizer/pando/engine'
import { prune } from '@zenless-optimizer/pando/engine'
import { type OptimizationConfig, optimize } from './webgpuOptimizer'

/**
 * Optional WebGPU solver tuning knobs. Mirrors the `OptimizationConfig`
 * fields; left undefined, the proven 256/256 f32 defaults are used.
 */
export interface WebGpuSolverOptions {
  /** threads per workgroup baked into the WGSL (default 256) */
  workgroupSize?: number
  /** permutations evaluated per invocation (default 256) */
  cyclesPerInvocation?: number
  /** f16 coordinate storage when the device supports `shader-f16` */
  f16?: boolean
  /** EXPERIMENTAL: double-buffered dispatch; off by default (A/B test first) */
  doubleBuffer?: boolean
  /** target # of dispatches for the run (default 4); bigger chunks = fewer roundtrips */
  targetChunks?: number
  /** per-dispatch GPU-time budget (ms) for Windows TDR safety (default 1000) */
  chunkMs?: number
  /** force/disable the TDR rate calibration (default: auto on Windows) */
  calibrate?: boolean
}

/**
 * GPU-accelerated substitute for `Solver` with an identical interface and
 * high-level semantics: prune, sweep the pruned candidate space, keep the top
 * `topN` builds. Falls back to the CPU `Solver` when WebGPU is unavailable or
 * the node graph cannot be compiled to WGSL.
 */
export class WebGpuSolver<ID extends string | number> {
  results: Promise<BuildResult<ID>[]>
  terminate: (reason: unknown) => void = () => {}
  private aborted = false

  constructor(
    cfg: SolverConfig<ID>,
    private options: WebGpuSolverOptions = {}
  ) {
    const { setProgress } = cfg
    const beforeCount = buildCount(cfg.candidates)
    const pruned = prune(cfg.nodes, cfg.candidates, 'q', cfg.minimum, cfg.topN)
    const progress: Progress = {
      computed: 0,
      failed: 0,
      skipped: beforeCount - buildCount(pruned.candidates),
      remaining: buildCount(pruned.candidates),
    }
    if (progress.remaining > Number.MAX_SAFE_INTEGER)
      throw new Error('too many combinations')

    let finalize: (result: BuildResult<ID>[]) => void = () => {}
    const report = () => setProgress({ ...progress })
    this.results = new Promise((res, rej) => {
      finalize = (result) => (report(), res(result))
      this.terminate = (reason) => {
        this.aborted = true
        rej(reason)
      }
    })

    void this.run(cfg, pruned, progress, finalize)
  }

  private async run(
    cfg: SolverConfig<ID>,
    pruned: {
      nodes: NumTagFree[]
      minimum: number[]
      candidates: Candidate<ID>[][]
    },
    progress: Progress,
    finalize: (result: BuildResult<ID>[]) => void
  ) {
    const params: OptimizationConfig<ID> = {
      candidates: pruned.candidates,
      nodes: pruned.nodes,
      minimum: pruned.minimum,
      topN: cfg.topN,
      setProgress: (p) => {
        Object.assign(progress, p)
        // Forward to the app (the optimizer throttles these to ~50ms)
        cfg.setProgress({ ...progress })
      },
      isAborted: () => this.aborted,
      ...this.options,
    }
    try {
      const result = await optimize(params)
      finalize(result)
    } catch (e) {
      if (this.aborted) return
      console.warn(
        '[WebGpuSolver] WebGPU optimization failed, falling back to CPU:',
        e
      )
      const cpu = new Solver(cfg)
      cpu.results.then(finalize, (reason) => this.terminate(reason))
    }
  }
}
