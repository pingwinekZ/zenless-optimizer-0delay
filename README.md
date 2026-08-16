# Zenless Optimizer

A web-based build optimizer for **Zenless Zone Zero (ZZZ)**. Import your agents, discs, and w-engines, then let the optimizer find the best builds — damage, survivability, or your own custom goals.

Fork of [hsr-optimizer](https://github.com/fribbels/hsr-optimizer) and [genshin-optimizer](https://github.com/frzyc/genshin-optimizer).

## Tech Stack

- **React 19 + TypeScript** (strict) — frontend
- **Nx 23** monorepo, **Vite 8** build, **bun** as package manager
- **Mantine v9** UI, Tabler icons, ag-grid, recharts
- **Zustand v5** state, **zod** validation, **i18next** localization
- **Jest / Vitest** tests, **Cypress** e2e, **Playwright** WebGPU e2e

## Getting Started

Prerequisites: [bun](https://bun.sh) (package manager is `bun` — never use npm/yarn).

```bash
# Install dependencies
bun install

# Initialize datamine data submodules (required for dev/build)
bun run reload-dm

# Start the dev server on :4200
bun nx serve zzz-frontend

# Production build
bun nx build zzz-frontend
```

> `gen-file` and full builds depend on the datamine submodule
> (`app/src/dm/HakushinData`). Run
> `bun run reload-dm` first if it is not initialized.

## Project Structure

```
app/                    # Frontend application (Vite + React + Mantine)
  src/<module>/         # ZZZ-specific code: db, formula, solver, stats,
                        # pages/*, dm, schema, util, disc-scanner, ...
  src/dm/HakushinData/  # git submodule — datamine data
packages/
  common/               # Shared utilities (database, UI, pipeline, localization)
  game-opt/             # Optimizer logic (engine, formula, solver, sheet-ui)
  pando/engine/         # Pando calculation engine
```

Path aliases: `@zenless-optimizer/<scope>/<name>` → `packages/<scope>/<name>/src/index.ts` (see `tsconfig.base.json`).

## Commands

```bash
bun run mini-ci            # Local CI: format+organize imports → affected eslint:lint → affected typecheck+test
bun run test               # Run all tests (nx run-many)
bun nx serve zzz-frontend  # Dev server on :4200
bun nx build zzz-frontend  # Production build
bun nx graph               # Dependency graph

# Single package
npx nx test <project>          # e.g. npx nx test zzz-stats
npx nx typecheck <project>     # e.g. npx nx typecheck zzz-frontend
npx nx eslint:lint <project>   # ESLint with --max-warnings=0

# Formatting (Biome)
bun biome ci                       # Format check only (read-only)
bun biome format --write           # Auto-format
bun biome check --write --formatter-enabled=true --linter-enabled=false --assist-enabled=true  # Format + organize imports

# Codegen & data
bun run gen-file                   # Regenerate generated files (needs submodule data)
bun run reload-dm                  # git submodule update --init
bun run update-dm                  # git submodule update --remote

# E2E
bun run e2e:webgpu                 # Playwright WebGPU e2e
```

## Documentation

- `AGENTS.md` — project conventions, CI workflow, and agent routing rules
- `packages/pando/engine/doc/` — Pando engine architecture (tags, nodes, propagation, optimization)
- `packages/pando/doc/` — Pando calculation model (name-scoped buffs, damage survey)
- `packages/game-opt/doc/overview.md` — game-opt layer (typed authoring API, solver)
- `app/src/formula/doc/` — ZZZ formula authoring (`api.md`, `glue.md`, `tags.md`)
- `gpusolver.md` — WebGPU solver design notes

## Development Conventions

- **Formatter**: Biome (single quotes, `asNeeded` semicolons, trailing commas es5, 2-space indent, 80-char width). Biome's linter is disabled — linting is done by ESLint only.
- **Linter**: ESLint with `@nx/typescript` rules, `unused-imports` (unused imports are errors), and module boundary enforcement.
- **TypeScript 5.7+** strict mode: `exactOptionalPropertyTypes`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`.
- **Tests**: Jest by default; Vitest for packages with a `vitest.config.ts`. Test files are `*.spec.ts` / `*.test.ts`.

## CI

`.github/workflows/ci.yml` runs on push/PR to `master`: install → lint (eslint) → typecheck → test → build → gen-file check → format check (biome ci). Locally, `bun run mini-ci` runs the same checks scoped to `nx affected` packages.

## License

[MIT](LICENSE)