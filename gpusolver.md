Plan: Port GPU-Accelerated (WebGPU) Solver from hsr-optimizer

Strategy

Port hsr-optimizer's WebGPU pipeline machinery (WGSL skeleton + injection, buffer management, permutation decode/carry chains, atomic compaction, double-buffered readback, threshold-climbing top-K queue) into a new Nx package packages/game-opt/solver-webgpu/. Replace the HSR-specific codegen (actions/conditionals/damage-function injection) with a Pando → WGSL compiler that mirrors the existing JS kernel generator (executionStr in packages/pando/engine/src/node/transform.ts:350, used by packages/game-opt/solver/src/worker.ts:140).

Why this mapping works: in ZZZ, createSolverConfig → detach already folds all conditionals/frames/teammates/set-effects into a single tag-free node DAG. The GPU kernel is simply that DAG compiled to WGSL — no per-action machinery needed. Set filters are constraint nodes already present in the DAG, so HSR's tuple mode / set-solutions matrices are dropped (naive dispatch only, per your choice).

Result: a WebGpuSolver class with the same contract as Solver (returns Promise&lt;BuildResult[]&gt; where BuildResult = { value, ids }), feeding the existing results pipeline (incl. batchComputeBuildStats re-evaluation for display) unchanged. f32-vs-f64 differences are accepted (same tolerance HSR uses).

1. New package: packages/game-opt/solver-webgpu/

Nx lib (name game-opt-solver-webgpu), mirrors packages/game-opt/solver project.json/tsconfig setup. Depends on pando/engine only (solver-agnostic; app does the prune orchestration like the CPU path, or the package exports a WebGpuSolver mirroring Solver).

Files (all new, ~10 files):

File	Purpose

src/wgsl/computeShader.wgsl	Generalized skeleton (ported from hsr-optimizer/src/lib/gpu/wgsl/computeShader.wgsl) with /* INJECT */ markers

src/wgsl/structs.wgsl	Candidate-independent structs: Params, NaiveParams (renamed PermParams), CompactEntry

src/codegen/compileWgsl.ts	Pando → WGSL codegen (core new logic, see §2)

src/dataTransform.ts	Candidate → flat f32 matrix, coord-name→index map, slot offsets, JS-side index↔candidate-ids decode (port of webgpuDataTransform.ts, generalized to N slots)

src/topK.ts	Min-heap top-N queue (port of hsr FixedSizeNumericMinQueue; check if @zenless-optimizer/common already has one)

src/webgpuDevice.ts	getWebgpuDevice(), uniformCompatible() (port of webgpuDevice.ts, minus HSR store/notification deps)

src/webgpuTypes.ts	GpuExecutionContext, params structs (port, generalized)

src/webgpuInternals.ts	Pipeline init, buffer creation (candidates matrix, params, compact count/results/validCount ×2, read buffers), bind groups, dispatch, destroy (port of webgpuInternals.ts)

src/webgpuOptimizer.ts	Naive dispatch loop: double-buffered batches, overflow revisit, threshold climbing, results decode → BuildResult[] (port of webgpuOptimizer.ts naive path, dropped runTupleDispatch)

src/index.ts	Exports

2. Pando → WGSL codegen (compileWgsl.ts)

Mirror executionStr node-for-node. traverse(nodes, …) assigning temp names x0, x1, …; emit let x{i} = &lt;expr&gt;; per node; return the objective value name + constraint names.

Node op	JS kernel (executionStr)	WGSL

const	literal	f32(&lt;n&gt;) / f32(&lt;n&gt;.0)

sum/prod	a+b+… / a*b*…	same (parenthesized)

min/max	Math.min(a,b,c)	nested min(min(a,b),c) / max

sumfrac	x/(x+c)	(x0/(x0+x1))

match	b0===b1?a:b	select(b, a, b0 == b1) (or if since WGSL select evaluates both sides — fine, both are f32)

thres	b0&gt;=b1?a:b	select(b, a, b0 &gt;= b1)

read	+(Σ_slots (cnds[slot]['q']??0)+0)	(coords[(s0+c0)*Q+k] + coords[(s1+c1)*Q+k] + …) where k = coord index for tag's q name, c{i} = slot candidate index, s{i} = slot offset (see §3)

subscript	JSON.stringify(n.ex)[br0]	constant-array literal: (array&lt;f32,N&gt;(…)[br0]); WGSL requires let + const-array so emit const _arr{i}: array&lt;f32,N&gt; = array&lt;f32,N&gt;(…); then index

lookup	([x])[(obj)[br0]??0]	index x array by constant map lookup: emit const *lk{i}: array&lt;f32,M&gt; = …;* lk{i}[br0] (default 0 → clamp index)

custom	JS fn	not supported initially — assert/throw; verify ZZZ formula uses none (check customOps usage in formula layer)

WGSL restrictions to handle: no f64 (all f32), no implicit conversions, no %-with-negatives issues (indices are u32), runtime array indexing is allowed for storage/var&lt;function&gt; arrays.

Also generate: constraint checks if (min{i} &gt; x{i}) { continue; } (skip constraint 0 = objective threshold — matches worker.ts:145), objective threshold check if (threshold &gt; x0) { continue; }, then compact write.

3. Candidate matrix + shader data flow

- Coordinate table: after prune, collect the union of all q keys across all candidates (each key → index 0..Q-1). Flatten: coords[slotOffset + candidateIdx*Q + coordIdx] for each slot's candidates. Build SLOT_COUNTS[], SLOT_OFFSETS[] as uniform constants.

- Index space: mixed-radix over 7 slots (wengine + 6 discs), sizes = pruned candidate counts per slot. generateParamsMatrix(offset, …) ported to 7 slots (extend NaiveParams to 7 offsets x0..x6 + threshold + permLimit).

- Shader main loop (ported computeShader.wgsl): decode c0..c6 from index, CYCLES_PER_INVOCATION=256 iterations with carry chain (like HSR, generalized to 7 slots); evaluate generated expressions; constraint filters; threshold; atomic compaction atomicAdd(&amp;compactCount) → compactResults[slot] = CompactEntry(index, value); atomicAdd(&amp;validCount, 1).

- No relic structs / set bitmasks / set solutions matrices — removed.

4. WebGpuSolver + app integration

- packages/game-opt/solver-webgpu/src/solver.ts: class WebGpuSolver&lt;ID&gt; accepting { nodes, minimum, candidates, topN, setProgress, resultsLimit }, runs prune (same as Solver constructor), initializes device/pipeline, iterates dispatch batches with requestAnimationFrame-style progress updates, returns Promise&lt;BuildResult&lt;ID&gt;[]&gt; (top-N), terminate() cancels. Progress { computed, failed, skipped, remaining } semantics preserved.

- app/src/page-optimize/Optimize/index.tsx:760-790: branch on engine choice — new Solver(config) vs new WebGpuSolver({...config}); guard navigator.gpu presence with CPU fallback.

- Sidebar toggle in app/src/page-optimize/Sidebar/OptimizerControlsSection.tsx (or OptimizerSidebar.tsx): small "Compute: CPU/GPU" segmented control, disabled when WebGPU unavailable (tooltip "WebGPU not supported in this browser"). Persisted via a small new DataEntry (app/src/db/Database/DataEntries/ — pattern per DisplayDiscEntry.ts) + zustand hook (e.g. extend useOptimizerDisplayStore or new store), default CPU.

- app/src/page-webgpu/: optional minimal diagnostics page (device/adapter info, shader compile check) — keep tiny.

5. Tests

- Codegen parity (Vitest/Jest in new package): build a small JS "WGSL interpreter" for the emitted expression subset — or better: snapshot the WGSL string and evaluate both JS kernel and WGSL-derived value function on random candidate sets over synthetic node graphs (incl. match, thres, lookup, subscript, nested min/max, sumfrac) asserting identical values.

- Playwright GPU tests (new app/tests/webgpu/ + playwright config + @webgpu/types): headless-Chromium page loads a test bundle that builds a synthetic config (or a fixture based on a real ZZZ character), runs CPU vs GPU solve on identical data, asserts same top-N ids and value within epsilon. Mirrors hsr-optimizer's tests/ + scripts/ approach.

- CI: add test targets to project.json; Playwright test as separate optional script (not blocking mini-ci initially).

6. Dependency &amp; config changes

- Root package.json: add @webgpu/types (devDep), playwright (devDep) if not present.

- tsconfig.base.json: nothing new (path alias @zenless-optimizer/game-opt/solver-webgpu auto-generated by Nx convention — verify it matches existing alias pattern).

- WGSL imported via Vite ?raw (supported out of the box; verify no vite-env declaration needed for *.wgsl?raw — add declare module '*.wgsl?raw' to a .d.ts if missing).

- app/src module-boundary lint: new package tags like game-opt sibling.

7. Execution order (milestones)

1. Scaffold: solver-webgpu package (project.json, tsconfigs, index) + @webgpu/types + *.wgsl?raw declaration.

2. Codegen: compileWgsl.ts + parity tests against JS kernel (pure TS, no GPU needed) — highest-risk piece, done first.

3. Pipeline: wgsl/ skeletons, dataTransform.ts, topK.ts, webgpuDevice.ts, webgpuInternals.ts, webgpuOptimizer.ts.

4. WebGpuSolver + synthetic-end-to-end test (Playwright).

5. App integration: engine toggle, DB persistence, Optimize page branch.

6. Polish: progress reporting, cancel, overflow safety, precision notes; optional page-webgpu diagnostics.

7. CI: wire test targets; run bun run mini-ci.

Risks / notes

- WGSL codegen subtleties (select vs branch, const arrays, subscript/lookup array lengths) — mitigated by parity tests in milestone 2.

- f32 precision: values may differ in last decimals vs CPU; accepted per decision.

- Threshold-boundary: shader skips value &lt;= threshold where CPU uses minimum[0] climbing — same mechanism, minor boundary divergence possible (accepted).

- custom ops in formula: verify none used; if present, plan B = evaluate the finite set of custom fns in WGSL (they're pure math; port one-by-one).

- Browser support: Chrome/Edge/Opera only; toggle auto-disables elsewhere.