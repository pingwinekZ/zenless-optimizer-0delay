feel free to fork and update this cool site for this dumb ass shit poop game. i recomend free ai from opencode, it has good free daily limit and freebuff as last resort. 
# Zenless Optimizer

A web-based build optimizer for **Zenless Zone Zero (ZZZ)**. Import your agents, discs, and w-engines, then let the optimizer find the best builds — damage, survivability, or your own custom goals.

Fork of [hsr-optimizer](https://github.com/fribbels/hsr-optimizer) and [genshin-optimizer](https://github.com/frzyc/genshin-optimizer).

Prerequisites: [bun](https://bun.sh) and node.

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
> (`packages/zzz/dm/src/NanokaData`). Run
> `bun run reload-dm` first if it is not initialized.

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
bun nx run zzz-dm:get-nanoka       # Fetch Nanoka datamine JSON into packages/zzz/dm/src/NanokaData
bun run reload-dm                  # git submodule update --init
bun run update-dm                  # git submodule update --remote
```

## Documentation

- `AGENTS.md` — project conventions, CI workflow, and agent routing rules
- `packages/pando/engine/doc/` — Pando engine architecture (tags, nodes, propagation, optimization)
- `packages/pando/doc/` — Pando calculation model (name-scoped buffs, damage survey)
- `packages/game-opt/doc/overview.md` — game-opt layer (typed authoring API, solver)
- `docs/dev/character-wengine-implementation-guide.md` — adding characters/W-Engines
- `docs/dev/formula-ui-character-sheet-guide.md` — formula UI sheets
- `gpusolver.md` — WebGPU solver design notes

## License

[MIT](LICENSE)
