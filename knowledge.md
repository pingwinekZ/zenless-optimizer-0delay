# Knowledge: zenless-optimizer

Zenless Zone Zero (ZZZ) optimizer web app — fork/frankenstein of [hsr-optimizer](https://github.com/fribbels/hsr-optimizer) and [genshin-optimizer](https://github.com/frzyc/genshin-optimizer). Version 10.34.0, MIT.

## Stack

- React 19 + TypeScript (strict), **Nx 23** monorepo, **Vite 8** build
- UI: **Mantine v9** (`@mantine/*`, postcss-preset-mantine), Tabler icons, ag-grid, recharts
- State: Zustand v5; validation: zod; i18n: i18next (browser language detection)
- Extras: tesseract.js (disc scanner OCR), WebGPU solver (`app/src/page-webgpu`, `app/webgpu-harness.html`), Cypress e2e, Playwright WebGPU e2e
- Package manager: **bun** (`bun.lock`). Never use npm/yarn.

## Layout

- `app/` — frontend app, Nx project `zzz-frontend` (Vite + React + Mantine)
- `app/src/<module>/` — ZZZ-specific code: `db`, `formula`, `solver`, `stats`, `pages/*`, `dm`, `schema`, `util`, `disc-scanner`, etc.
- `app/src/dm/HakushinData` — **git submodule** (datamine data)
- `packages/common/` — shared utilities (database, UI, pipeline, localization, Nx plugin)
- `packages/game-opt/` — optimizer logic (engine, formula, solver, sheet-ui)
- `packages/pando/engine/` — Pando calculation engine
- Path aliases: `@zenless-optimizer/<scope>/<name>` → `packages/<scope>/<name>/src/index.ts` (`tsconfig.base.json`)

## Commands (run via bun / npx nx)

```bash
bun run mini-ci                    # Local CI: biome format+organize-imports (write) → nx affected eslint:lint → nx affected typecheck,test
bun nx serve zzz-frontend          # Dev server on :4200
bun nx build zzz-frontend          # Build frontend
bun run test                       # nx run-many -t test (all)
npx nx run-many --target=typecheck
npx nx run-many --target=eslint:lint --max-warnings=0
npx nx run-many -t gen-file        # Regenerate generated files (needs submodule data)
bun biome ci                       # Format check only (read-only)
bun biome format --write           # Auto-format
bun run reload-dm                  # git submodule update --init
bun run update-dm                  # git submodule update --remote
```

Single package: `npx nx test <project>`, `npx nx typecheck <project>`, `npx nx eslint:lint <project>`. Some app sub-projects lack a typecheck target (e.g. `zzz-dm`) — typecheck `zzz-frontend` instead.

## Conventions

- **Formatter: Biome** — single quotes, `asNeeded` semicolons, trailing commas es5, 2-space indent, LF, 80-char width. Biome **linter is disabled**.
- **Linter: ESLint** — `@nx/typescript`, `unused-imports` (unused imports are errors), `@nx/enforce-module-boundaries`.
- **TypeScript strict** with `exactOptionalPropertyTypes`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`.
- **Tests**: Jest by default; Vitest where a `vitest.config.ts` exists (`pando/engine`, `zzz-frontend`). Files are `*.spec.ts` / `*.test.ts`.
- Doc sites: `packages/pando/engine/doc/`, `packages/pando/doc/`, `packages/game-opt/doc/overview.md`, `app/src/formula/doc/` (api.md, glue.md, tags.md).
- Full agent-conventions doc (subagents, skills, routing rules) lives in `AGENTS.md`.

## Gotchas

- `gen-file` depends on the HakushinData submodule. Run `bun run reload-dm` first if submodules are empty/not initialized.
- `zzz-frontend` build implicitly depends on `common-localization` and `zzz-localization` (`project.json`).
- `mini-ci` uses `nx affected` (only checks what changed since `master`); CI (`.github/workflows/ci.yml`) uses `nx run-many` over everything. For a full local check use `run-many`.
- Biome format check and ESLint lint are separate and both must pass. Biome ignores: data submodule dirs, `*_gen.json`, coverage, dist, `.nx/cache`, locale JSON files.
- Default base branch is `master`. Nx Cloud is disabled. `.envrc` sets up direnv with `layout node`.
