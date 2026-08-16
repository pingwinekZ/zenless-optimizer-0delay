# game-opt-solver-webgpu

WebGPU-accelerated solver for the Zenless Zone Zero optimizer.

This package ports the GPU optimization backend from the HSR optimizer: a WGSL
compute shader enumerates every combination of candidate equips (1 wengine + 6
discs) in a massively parallel fashion, filters builds against the optimization
constraints, and returns the top-N results. The shader body is *generated* from
the Pando node graph produced by `detach`/`prune`, mirroring the JS kernels
emitted by `packages/game-opt/solver`.

## Structure

- `src/wgsl/` — WGSL skeleton files with `/* INJECT */` markers
- `src/codegen/compileWgsl.ts` — Pando node graph → WGSL expression codegen
- `src/codegen/mixedRadix.ts` — chunked dispatch / index decode helpers
- `src/webgpuInternals.ts` — device/pipeline/buffer initialization
- `src/webgpuOptimizer.ts` — dispatch loop, readback, and top-K queue
- `src/solver.ts` — `WebGpuSolver`, a `Solver`-compatible entry point

## Testing

- `bun test` (in this directory) — codegen parity tests that evaluate the
  emitted WGSL expressions in-process and compare against the JS kernels.
- `bun run e2e:webgpu` (repo root) — Playwright end-to-end parity check that
  runs the real GPU dispatch in headless Chromium and asserts the GPU and CPU
  solvers return the same top-N builds (values within f32 tolerance). The
  harness page lives at `app/webgpu-harness.html` and the test script at
  `app/tests/playwright/webgpu-e2e.ts`. Requires a Chromium binary (set
  `GPU_CHROME_EXECUTABLE` if not at `/opt/helium-browser-bin/chrome`).

## Notes

- The kernel uses `f32`; results match the CPU solver within f32 precision.
- Requires a WebGPU-capable browser (Chrome/Edge/Opera). Falls back to the CPU
  solver when `navigator.gpu` is unavailable.