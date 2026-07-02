# Project: Zenless Optimizer (zenless-optimizer)

Zenless Zone Zero optimizer app. Built with React, TypeScript, Nx, Mantine UI, and Vite.

## Structure

- `app/` — frontend application (Vite + React, Mantine v9)
- `packages/` — shared libraries
  - `common/` — utilities (database, UI, pipeline, localization, plugin, etc.)
  - `game-opt/` — optimizer logic (engine, formula, solver, sheet-ui)
  - `pando/engine/` — Pando calculation engine

- `app/src/<module>/` — ZZZ-specific source (db, formula, solver, pages, dm, stats, etc.)
- `app/src/dm/ZenlessData`, `app/src/dm/HakushinData` — git submodules (datamine data)

Path aliases: `@zenless-optimizer/<scope>/<name>` → `packages/<scope>/<name>/src/index.ts` (defined in `tsconfig.base.json`).

## Commands

Package manager: **bun**. Use `bun`, not `npm` or `yarn`. Lockfile is `bun.lock`.

### Local CI (pre-push verification)

```bash
bun run mini-ci
```

Runs: format+organize imports (biome, write mode) → `nx affected -t typecheck` → `nx affected -t eslint:lint --max-warnings=0` → `CI=true nx affected -t test`.

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on push/PR to master: install → lint (eslint) → typecheck → test → build zzz-frontend → gen-file check → format check (biome ci). Order matters; lint runs first. Uses `nx run-many` (all packages).

### Individual commands

```bash
bun nx serve zzz-frontend               # Dev server on :4200
bun nx build zzz-frontend               # Build frontend
bun nx graph                            # Dependency graph
npx nx run-many --target=typecheck      # Typecheck all
npx nx run-many --target=eslint:lint --max-warnings=0  # Lint all
npx nx run-many --target=test           # Test all (Jest + Vitest)
npx nx run-many -t gen-file             # Regenerate generated files
bun biome ci                            # Format check only (read-only)
bun biome format --write                # Auto-format (Biome)
bun biome check --write --formatter-enabled=true --linter-enabled=false --assist-enabled=true  # Format + organize imports
```

### Single package

```bash
npx nx test <project-name>              # e.g. npx nx test zzz-stats
npx nx typecheck <project-name>         # Most projects support this; for app/ sub-projects without typecheck (zzz-dm, etc.), use `npx nx typecheck zzz-frontend`
npx nx eslint:lint <project-name>
```

### Data submodules

```bash
bun run reload-dm   # git submodule update --init
bun run update-dm   # git submodule update --remote
```

## Code Style

- **Formatter**: Biome (single quotes, `asNeeded` semicolons, trailing commas es5, 2-space indent, LF, 80 char line width). Biome linter is **disabled** — linting is done by ESLint only.
- **Linter**: ESLint with `@nx/typescript` rules, `unused-imports` plugin (unused imports are errors), and module boundary enforcement (`@nx/enforce-module-boundaries`).
- **TypeScript 5.7**: strict mode with `exactOptionalPropertyTypes`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`.
- **Testing**: Jest (default, `@nx/jest:jest`) for most libs; Vitest for packages with `vitest.config.ts` (e.g., `pando/engine`, `zzz-frontend`). Test files are `*.spec.ts` or `*.test.ts`.
- **UI**: Mantine v9, `@mantine/core`, `@mantine/hooks`, `postcss-preset-mantine`, Tabler icons.
- **State**: Zustand v5.
- **i18n**: i18next, react-i18next, browser language detection. Locale assets copied at build via `viteStaticCopy`.
- **Patches**: Mantine v9 has patches in `patches/` (`@mantine-core-9.2.1.patch`, `@mantine-hooks-9.2.1.patch`).

## Custom Agents

The following custom subagents are available (invoke with `@agent-name`):

- **@backend-developer**: MUST use for all server-side logic, API design, database schemas, auth, and backend systems
- **@frontend-developer**: MUST delegate to for all UI/UX work: components, styling, accessibility, browser APIs
- **@fullstack-developer**: USE for end-to-end features spanning both frontend and backend systems together
- **@websocket-engineer**: MUST use for WebSockets, SSE, real-time communication, and event-driven architectures
- **@typescript-pro**: MUST use for strict typing, generics, utility types, type definitions, and TS config
- **@javascript-pro**: MUST use for JS/ES2024+ patterns, async, module systems, and runtime optimization
- **@react-specialist**: MUST use for React 19 hooks, Suspense, and state management
- **@vue-expert**: MUST delegate to for Vue 3 Composition API, Pinia, Vue Router, Nuxt, and Vue ecosystem
- **@angular-architect**: MUST use for all Angular 15+ work: signals, standalone components, RxJS, NgRx
- **@nextjs-developer**: MUST delegate to for Next.js App Router, Server Actions, RSC, SSR, and deployment
- **@devops-engineer**: MUST delegate to for CI/CD, Docker, deployment, infrastructure, and environment config
- **@code-reviewer**: USE PROACTIVELY for code review, security audit, performance analysis, best-practice checks
- **@build-engineer**: MUST use for webpack, vite, esbuild, gradle, maven build configs and pipeline optimization
- **@dependency-manager**: USE for auditing, updating, managing dependencies — security, compatibility, bundle size
- **@docs-writer**: MUST use for generating and maintaining all project documentation — README, API docs, guides
- **@git-workflow-manager**: USE for git branching, commit hygiene, rebasing, merging, and workflow automation
- **@test-writer**: MUST delegate to for writing, running, debugging tests — unit, integration, e2e
- **@technical-writer**: USE for technical documentation, API guides, tutorials, and developer onboarding content

## Subagent Routing Rules

- Do NOT attempt to do specialized work yourself — ALWAYS delegate to the appropriate subagent
- For server-side/backend work, ALWAYS delegate to `@backend-developer`
- For UI/frontend work in React, Vue, Angular, ALWAYS delegate to the respective framework subagent
- For code review or quality analysis, ALWAYS use `@code-reviewer`
- For testing tasks, ALWAYS delegate to `@test-writer`
- For documentation, ALWAYS use `@docs-writer` or `@technical-writer`
- For build tooling or bundler config, ALWAYS use `@build-engineer`
- For git operations or branch management, ALWAYS use `@git-workflow-manager`
- For dependency management or audits, ALWAYS use `@dependency-manager`
- For devops/CI/CD or deployment, ALWAYS use `@devops-engineer`
- For real-time communication features, ALWAYS use `@websocket-engineer`
- When a task spans both frontend and backend, delegate to `@fullstack-developer`
- For any type-system or TypeScript concerns, delegate to `@typescript-pro`
- For pure JavaScript or runtime optimization, delegate to `@javascript-pro`
- Use `@explore` ONLY for quick read-only file lookups and codebase exploration
- Use `@general` for tasks that do not clearly match any specialized subagent

## Available Skills

The following skills are installed and will be loaded on demand (in `.opencode/skills/`):

- **git-release**: Release notes and version bumps
- **test-patterns**: Test generation following project conventions
- **dependency-audit**: Audit dependencies for vulnerabilities and license issues
- **changelog-generate**: Changelog generation from commit history
- **ci-pipeline**: CI pipeline configuration and optimization

## Documentation

Key docs scattered across libs (READMEs in each lib directory give quick intros):

- `packages/pando/engine/doc/` — Pando engine architecture (tags, nodes, usage, propagation, optimization, customization)
- `packages/pando/doc/` — Pando calculation model (name-scoped buffs, damage survey)
- `packages/game-opt/doc/overview.md` — game-opt layer (typed authoring API, solver)
- `app/src/formula/doc/` — ZZZ formula authoring (api.md, glue.md, tags.md)

## Gotchas

- `gen-file` targets depend on `load-dm` (submodule data). Run `bun run reload-dm` before generating if submodules are empty.
- `zzz-frontend` build depends on `common-localization` and `zzz-localization` (implicit deps in `project.json`).
- `mini-ci` uses `nx affected` — only checks packages changed since master. For full checks, use `nx run-many`.
- CI uses `nx run-many` (all packages). Local `mini-ci` uses `nx affected`.
- Biome format check is separate from ESLint lint. Both must pass, but they check different things.
- Biome ignores: data submodule directories, `*_gen.json`, coverage, dist, `.nx/cache`, locale JSON files.
- Default base branch is `master`.
- Nx Cloud is disabled (`nxCloudAccessToken_disabled` in `nx.json`).
- `.envrc` enables direnv with `layout node`.
