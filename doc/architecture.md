# Architecture (current, Phase 2 baseline)

This doc sketches the layering as it exists today. It is the baseline for the
refactor plan (`zenless-refactor-plan.md`); update it as phases land.

## Layers (bottom → top)

```
Pando engine (`packages/pando/engine`, project: `pando_engine`)
  Generic tag/node calculation engine. Knows nothing about games.
  ↓
game-opt engine (`packages/game-opt/engine`, `game-opt-engine`)
  Typed authoring API on top of Pando: `tag`, `read`, `convert`,
  `registerBuff`, conditional helpers, `teamBuff` fan-out
  (`read.ts:72-82` via `stackIn`/`stackOut` reread).
  ↓
game-opt formula/solver (`game-opt-formula`, `game-opt-solver`,
  `game-opt-solver-webgpu`) + `game-opt-formula-ui`, `game-opt-sheet-ui`
  Game-agnostic formula/solver/sheet UI primitives.
  ↓
ZZZ domain (Nx libs, all `scope:zzz`, `layer:domain`): `zzz-db`, `zzz-db-ui`,
  `zzz-schema`, `zzz-zood`, `zzz-formula`, `zzz-formula-ui`, `zzz-stats`,
  `zzz-solver` (incl. calculator entry assembly + `BuildRecipe`
  materialization), `zzz-assets`, `zzz-assets-data`, `zzz-dm`,
  `zzz-dm-localization`, `zzz-localization`, `zzz-ui`, `zzz-svgicons`,
  `zzz-util`, `zzz-disc-scanner`, `zzz-i18n`, `zzz-websocket` under `app/src/*`,
  plus `zzz-consts/util/svgicons/disc-scanner/i18n/websocket/localization/
  dm-localization/assets/assets-data/stats/formula-ui` at `packages/zzz/*/src`
  (P2-2 pilot + batches 2/3a/3b/3c, incl. executors + vite locale paths).
  Game data, formula sheets, solver, DB, shared widgets. Must not import
  from feature/app layers.
  ↓
ZZZ feature (`zzz-page-home`, `zzz-page-settings`, `zzz-page-wengines`)
  Leaf pages. May import domain + engine + shared. Must not import other
  feature projects (or the app shell).
  ↓
App shell (`zzz-frontend`: `app/src/app`, the page triangle
  (`page-characters`, `page-discs`, `page-optimize` — still coupled, see
  below), `main.tsx`, root CSS, `i18n-node` (unreferenced, knip candidate))
  Composition root: tab switcher, providers, routing (future).
  May import everything.
```

## Shared

`packages/common/*` (`scope:shared`, `layer:shared`): `util`, `pipeline`,
`plugin`, `localization`, `img-util`, `svgicons`, `react-util`, `ui`,
`database`, `database-ui`, `ad`. Importable from any layer; themselves only
depend on `layer:shared` / `layer:base`. In-app shared:
`zzz-rendering`, `zzz-theme` (`layer:shared`, at `packages/zzz/*/src` since the
P2-2 pilot).

## Key data flows

- **Calc**: `formula/data` entries + `formula/meta` sheets → `compileTagMapValues`
  → `Calculator` (`formula/calculator.ts`) → `calc.compute(read(...))`.
- **Team buffs**: sheet `teamBuff.*.add(...)` entries (with `src: teammateKey`)
  are fanned out to each member's `own` reads by `teamData()` in
  `formula/util.ts:172-231`. Aggregation into `sheet:agg` is lossy for
  analysis — see Phase 1 (provenance layer).
- **Analysis**: `page-optimize/Analysis/ExpandedDataPanelController.ts`
  rebuilds a calculator via `buildCalculatorEntries` (`solver/buildStatsUtils.ts`)
  and recomputes `targetTag` + `final.*` stats. Per-source provenance:
  `formula/contributions.ts` (leave-one-out over source-sheet groups).
  Baseline coverage: `app/src/formula/attribution.baseline.spec.ts`;
  provenance coverage: `page-optimize/Analysis/contributions.spec.ts`.
- **DB**: `ZzzDatabase` (`zzz-db`) with 9 data managers; source of truth,
  persisted via `SlotStorage` (+ legacy localStorage migration). Persisted
  shapes live nearby: `zzz-schema` (zod shapes; `IDbDisc`), `zzz-zood`
  (validators); theoretical-build `BuildRecipe` is db-owned.

## Module boundaries (Phase 2, error-enforced)

Enforced via `@nx/enforce-module-boundaries` `depConstraints` in
`eslint.config.js`, severity `error`. Cross-project imports MUST use
`@zenless-optimizer/*` aliases (relative cross-project imports are errors);
same-project imports must stay relative. Import direction follows the
layer table below — cycles (e.g. the former `db→zood→schema→db` loop,
broken by moving `IDbDisc`/`BuildRecipe` ownership into `schema`/`db`)
fail lint.

| source layer    | may depend on                                          |
| --------------- | ------------------------------------------------------ |
| `layer:app`     | `*` (everything)                                       |
| `layer:feature` | domain, engine-ui, engine, shared, base                |
| `layer:domain`  | domain, engine-ui, engine, shared, base                |
| `layer:engine-ui`| engine-ui, engine, shared, base                       |
| `layer:engine`  | engine, shared, base                                   |
| `layer:shared`  | shared, base                                           |
| `layer:base`    | base                                                   |

Tags live in each `project.json` (`scope:*` + `layer:*`). Every `app/src/*`
directory except the page triangle (`page-characters`, `page-discs`,
`page-optimize`), `app`, and root files belongs to its own project, so
constraints cover the whole domain layer. The triangle stays in
`zzz-frontend` until Phase 4: the three pages import each other in a cycle
(scoring utils, `MultiSelectPills`, showcase/character previews), and
splitting them needs the component moves planned there — not forced moves
here. Leaf pages (`home`, `settings`, `wengines`) are already real
`layer:feature` projects proving the pattern.

## Phase 2 notes (P2-1, in-place split)

- Libs were split **in place** (`app/src/*` + `project.json` each), not moved
  to `packages/zzz/*` yet — same boundaries, fractional churn. The physical
  move (P2-2) is now mostly mechanical: `git mv` + alias paths already point
  at the right modules.
- `gen-file` for the season JSONs moved with its scripts from the deleted
  `zzz-page-optimize` project to `zzz-frontend` (same commands/outputs).
- `nx affected` is now useful: `nx graph` shows the intended DAG
  (domain leaves → db/formula/solver → pages/frontend).
