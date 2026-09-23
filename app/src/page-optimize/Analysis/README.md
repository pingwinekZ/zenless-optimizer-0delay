# Analysis panel

Port of hsr-optimizer's "Optimization results analysis" accordion
(`src/lib/tabs/tabOptimizer/analysis/`), rendered by
`Optimize/ExpandedDataPanel.tsx` under the selected-build preview.

## Layout

`AnalysisRender` parity, with the ZZZ-only reference card kept at the end:

```
FilterContainer → FormRow(OptimizerMenuIds.analysis)
  StatsDiffCard        equipped → selected, per-stat diff + char/W-Engine art
  ActionBreakdown      per-action damage with per-source shares + buffed stats
  DamageSplits         "Combo Breakdown" bar chart (recharts)
  row
    DamageTagPieChart  damage distribution donut
    DamageUpgrades     per-substat "+1 roll" damage gain
  ReferenceComparison  ZZZ-only: pinned theoretical build comparison
```

The teammate-upgrades table and the buff-summary column were removed: without
per-buff engine provenance the summary could only merge registry reads with
sheet-level leave-one-out deltas, and every symptom (duplicate rows, missing
pills, raw-key labels) was fallout of that merge. Per-action per-source damage
(the breakdown above) is what leave-one-out yields exactly, so that is what
the panel shows.

## Tags

Damage-type and attribute tags render through `TagPill` (`common/ui`), a direct
port of hsr-optimizer's `renderPill`: a 9px uppercase outlined pill, used by
both `OptTargetTagDisplay` and `FullTagDisplay` so tags match HSR app-wide.

The palette lives in `formula-ui` (`damageTypeColors.ts`, ported from HSR's
`ABILITY_COLORS`) so pills, charts and the filter bar share one hue per damage
type. Named Mantine colors resolve to shade 5 — ZZZ's element palettes are
alpha ramps, so the `Badge` outline variant picked a low-alpha shade and
rendered them washed out.

Pills carry HSR's three states: plain, `active` (filled, marks the current
filter) and `dimmed` (excluded by it).

All copy is i18n'd under the `analysis` key prefix in
`packages/zzz/localization/src/assets/locales/en/page_optimize.json`;
`FormRowLabels.Analysis` titles the accordion.

## Data

Everything the panel renders is computed off the render path in
`useBuildAnalysis` → `buildAnalysisData` (`Optimize/useBuildAnalysis.ts`):

- **Target reads** — single target: `new Read({ src: mainKey, ...targetTag(frame.tag) })`
  on `preset0`. Combo: per hit `new Read({ src: mainKey, ...targetTag({sheet, name}) })`
  on `preset${i}`, value × hit multiplier — mirroring the solver summation in
  `createSolverConfig` and `computeBuildStats`.
- **Buffed stats** — the 14 `final.*` reads on a `preset0`-scoped `own`
  reader, plus per-action variants with `name`.
- **Stat upgrades** (`statUpgrades`) — one full calculator build per substat
  via `computeBuildStats`, with a single extra roll injected by appending
  `{ key, upgrades: 1 }` to the first equipped disc (disc stats are summed by
  key in `discsToTagMapNodeEntries`, so the roll's position is irrelevant).
  Only deltas above 1 point survive. The loop yields between builds and
  abandons the run on `shouldCancel`.
- **Damage splits / distribution** (`damageSplitUtils.ts`) — derived from
  `targetInfo.perActionDamage`, colored by damage type
  (`damageTypes.ts`).
- **Per-source damage attribution** — the same `explainContributions` pass is
  handed every action's target reads, so `#groups + 1` calculator builds yield
  the per-action per-source shares the breakdown shows. See "Provenance
  method" below.
- **Custom frame buffs** — `frame.bonusStats` entries with `src: mainKey`,
  `sheet:custom`, `et:own`, preset-scoped. `sheet:custom` (not `agg`) keeps
  them attributable as the `custom` source.
- **Enemy stats** — `frame.enemyStats` entries with `et:enemy`, `sheet:agg`,
  `qt:common`, preset-scoped; grouped as the `enemy` source.

## Provenance method

`formula/contributions.ts`: `groupEntriesBySource` partitions dynamic entries
into excludable groups (character/W-Engine/disc sheets, `custom`, `enemy`;
`reread` routing/bridges are never excluded — and the panel passes no
`mainKey`, so the main character's sheet is a group too), and
`explainContributions` recomputes each action's exact target reads without one
group at a time. Delta = contribution. Zero-delta groups are dropped, so only
buffs targeting the opt target appear.

A group's entries are its **conditionals and counts**, not its buffs: stat
writes are authored against the sheet described by `ownTag` (`sheet: agg`/
`iso`), so removing a group disables the buffs those conditionals gate. That is
why a gated buff shows up as its source's contribution, and why a group that
never gates anything contributes nothing.

The panel goes through the async `explainContributionsAsync` instead:
`#groups + 1` full calculator builds is seconds of synchronous work on a
full team, far too much for one render pass, so it yields to the browser
between builds and abandons the run as soon as newer inputs arrive or the
page unmounts (`shouldCancel` → resolves `null`).

## Known limits

- A ZZZ action resolves to one damage figure, so a combo bar is a single
  damage-type segment where hsr-optimizer stacks several damage-tag segments.
  hsr's Default/Rotation action-set toggle has no ZZZ equivalent (the target
  already resolves to its action list), so the chart renders that list.
- The main character's sheet is a source group like any other. The engine
  excludes it by default (`mainKey`), but a kit's own buffs live there, so the
  panel passes no `mainKey`. Removing that group only drops its conditionals;
  the target formula and base stats are written against `sheet: agg`/`iso`, so
  the target still computes.
- Because a group's entries are its conditionals, **only buffs gated by one of
  those conditionals show a share**. Ungated stat writes, and writes gated by
  character data the group does not carry (mindscape level, specialty,
  `abilityCheck`, core/special levels), contribute nothing visible — removing
  the group does not disable them.
- Per-buff engine provenance was spiked and **rejected**: pando's tag matcher
  requires a query to carry every category its entries specify (an entry with
  an extra category stops matching unscoped reads), so buff-name-stamped
  entries went invisible to every existing read. A buff summary that names
  individual buffs with exact values and tags would need provenance outside
  tags (a sidecar from entry identity to buff) — until then, per-action
  per-source shares are what leave-one-out yields exactly.
