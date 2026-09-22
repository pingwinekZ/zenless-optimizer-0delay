# Analysis reads audit (Phase 1 baseline)

What `ExpandedDataPanelController.buildTargetInfo` reads, and how each is
attributed per source. This is the inventory Phase 1 step 1 called for.

## Target reads (per action)

- Single target: `new Read({ src: mainKey, ...targetTag(frame.tag) })`
  on `preset0`.
- Combo: per hit `new Read({ src: mainKey, ...targetTag({sheet, name}) })`
  on `preset${i}`, value × hit multiplier — mirroring the solver summation
  in `createSolverConfig` and `computeBuildStats`.
- `targetTag` comes from `TeamDataManager`: either a formula identity
  (`{sheet, name}`) or a stat target (`{q, qt}`).

## Buffed stats (per action + panel header)

- 14 `final.*` reads (`atk`, `dmg_`, `crit_`, …) on a `preset`-scoped
  `own` reader for the main char; per-action variants add
  `.with('name', actionName)`. Totals only — no per-source rows yet
  (follow-up: reuse `explainContributions` with stat targets).

## Custom frame buffs (`AppliedBuffStats`)

- `frame.bonusStats` → entries with `src: mainKey`, `sheet:custom`,
  `et:own`, preset-scoped. `sheet:custom` (not `agg`) so the provenance
  layer sees them as the `custom` source; behavior is preserved via the
  existing `sheet:agg <= sheet:custom` / `sheet:iso <= sheet:custom`
  rereads in `formula/data/common` (no `iso` read uses these `qt`s).
- `frame.enemyStats` → entries with `et:enemy`, `sheet:agg`, `qt:common`,
  preset-scoped; grouped as the `enemy` source. Sheet-authored enemy
  debuffs use `et:enemyDeBuff` + their own sheet and attribute there.

## Provenance method

`formula/contributions.ts`: `groupEntriesBySource` partitions dynamic
entries into excludable groups (teammate/W-Engine/disc sheets, `custom`,
`enemy`; main-char sheet and `reread` routing/bridges never excluded),
and `explainContributions` recomputes each action's exact target reads
without one group at a time. Delta = contribution. Zero-delta groups are
dropped, so only buffs targeting the opt target appear.

The panel goes through the async `explainContributionsAsync` instead:
`#groups + 1` full calculator builds is seconds of synchronous work on a
full team, far too much for one render pass, so it yields to the browser
between builds and abandons the run as soon as newer inputs arrive or the
page unmounts (`shouldCancel` → resolves `null`).

Known V1 limits: W-Engine/disc sheet rows include that sheet's base
(stats it adds, not just buffs); groups whose removal breaks a
unique-accumulator read are skipped; `buffedStats` has no per-source rows.
