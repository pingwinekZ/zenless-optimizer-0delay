# Updating for a new Zenless Zone Zero version

This fork gets its datamine JSON from [Nanoka](https://static.nanoka.cc/zzz/)
instead of Hakushin, and gets its images from the Nanoka asset CDN instead of
extracting them out of the game files. So a version bump is:

**bump the data version → refresh data → add keys/mappings → regenerate →
generate sheets → fill them in → test.**

Prerequisites: `bun install`, and

```bash
bun run reload-dm
```

to initialize the `packages/zzz/dm/src/NanokaData` submodule (needed for
`gen-file`).

## 1. Bump the data version and fetch the new data

First make sure the version is actually published. The CDN only serves versions
that exist, and everything 404s otherwise:

```text
https://static.nanoka.cc/zzz/<version>/character.json
```

Then set the new game version in
`packages/zzz/dm/src/executors/gen-nanoka/nanoka.ts`:

```ts
const VERSION = '3.3' // <- new version, e.g. '3.4'
```

Then fetch it:

```bash
bun nx run zzz-dm:get-nanoka
```

This writes the JSON for `character`, `weapon`, `bangboo`, `equipment` (discs),
`monster`, `boss`, `shiyu` and `noun` into
`packages/zzz/dm/src/NanokaData`.

> The refreshed submodule still has to reach the `zzz-nanoka-data-0delay` repo
> for CI and fresh clones to see it — handle that however you normally do.

## 2. Add the new keys and mappings

Use the freshly downloaded JSON under `packages/zzz/dm/src/NanokaData` as the
source of truth.

### 2a. `packages/zzz/consts/src`

Add the new agent / faction / disc set / W-Engine keys:

- `character.ts` — `allCharacterKeys` (copied from `characterKeys.json`, with
  unreleased/beta agents removed), `allFactionKeys`
- `disc.ts` — disc set keys (from `discKeys.json`)
- `wengine.ts` — W-Engine keys (from `wengineKeys.json`)

These lists are what the UI and solver expose, so beta agents must not be added
here.

> Keep these arrays (and the `characterKeys.json` / `wengineKeys.json` /
> `discKeys.json` sources they mirror) **alphabetically sorted**. The `genIndex`
> generators emit imports in array order and only run `biome format` on them —
> they do not organize imports — so an out-of-order array makes
> `gen-file`/sheet generation produce files that `biome ci` then rejects.

### 2b. `packages/zzz/dm/src/dm`

Update the ID maps and category maps:

- `character/consts.ts` — `characterIdMap`, `factionMap`, attribute/speciality
  maps (mirrors `characterIdMap.json`)
- `disc/consts.ts` — `DiscIdMap` (mirrors `discIdMap.json`)
- `wengine/consts.ts` — `WengineIdMap` (mirrors `wengineIdMap.json`)

> Every key added in 2a needs an ID in the matching `*IdMap`. A key without an
> ID silently produces no stat data (the generated `Data/` JSON just never
> appears), which then fails later in confusing ways.

Then wire up the per-character data that is not derived from the ID maps:

- `packages/zzz/stats/src/signatureWeapon.ts` — `characterKeyToWengineKey`
- `packages/zzz/util/src/character/effectiveStats.ts` — `characterPlans`
  (effective substats / weights / main stats for the disc optimizer)

Both are typed `Record<CharacterKey, …>`, so a missing agent is a typecheck
error.

## 3. Regenerate generated files

> If step 2 added new keys, run the sheet/stat-map generators from step 5
> **first**. `zzz-formula:gen-file` (`gen-desc`) iterates every entry in
> `allCharacterKeys`/`allWengineKeys`/`allDiscSetKeys` and hard-fails on a
> missing `packages/zzz/formula/src/meta/<type>/<Key>/` directory.

```bash
bun nx run-many -t gen-file --skip-nx-cache --verbose
```

This covers stats (`zzz-stats`), formula metadata (`zzz-formula`), locales
(`zzz-dm-localization`) and asset data (`zzz-assets-data`).

> CI runs `gen-file` and fails if the working tree is dirty afterwards, so
> commit the regenerated output.

## 4. Refresh images (optional)

There is no hdiff / AnimeStudio / `Blocks` extraction step anymore — images are
downloaded from the Nanoka CDN:

```bash
bun nx run zzz-assets:gen-file-remote
```

It clears and repopulates `packages/zzz/assets/src/gen` with `.webp` files for
agents, discs, W-Engines and the boss images used by the Shiyu Defense / Deadly
Assault pages, then regenerates the asset index. Skip it only if the new art is
already there.

## 5. Generate sheet and stat-map templates

```bash
bun nx generate @zenless-optimizer/zzz/formula:gen-all-sheets --verbose
bun nx generate @zenless-optimizer/zzz/formula-ui:gen-all-ui-sheets --verbose
bun nx generate @zenless-optimizer/zzz/stats:gen-all-maps --verbose
```

This creates the missing stubs under `packages/zzz/formula/src/data`,
`packages/zzz/formula-ui/src` and `packages/zzz/stats/src/Data`, and rewrites
the three `packages/zzz/formula-ui/src/{char,disc,wengine}/sheets/index.ts`
barrels from the `consts` key arrays. The data and UI generators live on
different projects (`zzz/formula` and `zzz/formula-ui`); use the collection
name printed in each command above.

> Generators registered on one project must not point their `factory` /
> `schema` at a sibling project with the same relative layout
> (`../formula-ui/src/generators/...`). Nx resolves such paths twice: first by
> walking up the path *inside the owning project*, which silently matches the
> local file with the same tail (`src/generators/gen-sheet/all-generator`), so
> the wrong generator runs. Keep each generator in the project that owns it.
> `gen-ui-sheet` / `gen-all-ui-sheets` therefore need `bun nx g
> @zenless-optimizer/zzz/formula-ui:gen-ui-sheet ...`, not `zzz/formula`.

## 6. Fill in the templates

Flesh out the generated sheets for each new agent / W-Engine / disc set:

- data sheet — `packages/zzz/formula/src/data/char/sheets/{Name}.ts`
- UI sheet — `packages/zzz/formula-ui/src/char/sheets/{Name}.tsx`
- locale strings — `packages/zzz/dm-localization/src/assets/locales/en/char_{Name}.json`

See `docs/dev/character-wengine-implementation-guide.md` and
`docs/dev/formula-ui-character-sheet-guide.md`. Then rebuild the metadata:

```bash
bun nx run zzz-formula:gen-file
```

## 7. Test

```bash
bun nx serve zzz-frontend   # http://localhost:4200
bun run mini-ci             # biome + eslint + test + typecheck (affected)
```

Spot-check the new agent page, new disc set and new W-Engine, and the
optimizer/import flow.

## Examples

- Version bump + data refresh:
  [493daf9](https://github.com/pingwinekZ/zenless-optimizer-0delay/commit/493daf9)
  (`VERSION` bump, `NanokaData` refresh)
- New agents + formula/UI sheets:
  [36f06d0](https://github.com/pingwinekZ/zenless-optimizer-0delay/commit/36f06d0)
