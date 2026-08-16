# Optimization Results Analysis — Implementation Plan

## Goal
Replicate HSR's "Optimization results analysis" accordion in zenless-optimizer's Optimizer tab, adapting components to ZZZ's data model.

## Current State
- **5 Analysis components** exist in `page-optimize/Analysis/` (StatsDiffCard, DamageSplitsChart, DamageTagPieChart, SubstatUpgrades, TeammateUpgrades) — all use mock data
- **ExpandedDataPanel.tsx** exists in `page-optimize/Optimize/` but is NOT imported or rendered
- **Layout primitives** (FormRow, FilterContainer, etc.) already exist
- **Real data** available: `enrichedBuilds[]` with `combatStats`/`baseStats`, `selectedBuild`, `equippedBuild`, disc database, team data

## Files to Create/Modify

### 1. `page-optimize/layout/optimizerMenuIds.ts`
- ADD `analysis: 'Analysis'` to `OptimizerMenuIds`
- ADD `[OptimizerMenuIds.analysis]: true` to `initialMenuState`

### 2. `page-optimize/Analysis/ExpandedDataPanelController.ts` (NEW)
- Export `AnalysisData` type and `buildAnalysisData()` function
- Builds analysis data from equipped build, selected build, enriched builds, disc lookup, team data, character data

### 3. `page-optimize/Analysis/StatsDiffCard.module.css` (NEW)
- CSS for enhanced StatsDiffCard with character image column

### 4. `page-optimize/Analysis/StatsDiffCard.tsx`
- Accept `analysisData: AnalysisData` prop
- Show equipped vs selected combat stats side-by-side with green/red diffs
- Add character portrait + W-Engine image column (CardImage component)

### 5. `page-optimize/Analysis/DamageSplitsChart.tsx` → Rename to `StatContributionChart.tsx`
- Replace per-action "Combo Breakdown" bar chart
- Show "DMG Stat Contribution" — bar chart of key damage stats (ATK, DMG%, CR%, CD%, PEN Ratio, Impact)
- Keep Recharts horizontal stacked bar pattern
- Update `Analysis/index.ts` export

### 6. `page-optimize/Analysis/DamageTagPieChart.tsx`
- Pivot from damage type distribution to relevant stat/category distribution
- Donut chart showing stat breakdown relative to caps

### 7. `page-optimize/Analysis/SubstatUpgrades.tsx`
- Replace mock data with real disc substat data from `database.discs.get()`
- Aggregate substat rolls across all 6 discs of selected build
- Show roll count + value per substat, ranked by DPS importance
- Remove EHP column

### 8. `page-optimize/Analysis/TeammateUpgrades.tsx`
- Replace mock data with real team composition
- Show each teammate's character, W-Engine, disc sets, mindscape
- Show estimated DPS contribution from teammate buffs
- No upgrade suggestions — purely informative

### 9. `page-optimize/Optimize/ExpandedDataPanel.tsx` (REWRITE)
- Use `FilterContainer` + `FormRow(id=OptimizerMenuIds.analysis)`
- Accept `analysisData` prop
- Layout:
  ```
  FilterContainer
    FormRow ("Optimization Results Analysis")
      StatsDiffCard
      StatContributionChart
      [flex row]
        DamageTagPieChart (flex: 1)
        [flex column]
          SubstatUpgrades
          TeammateUpgrades
  ```

### 10. `page-optimize/Optimize/index.tsx`
- Import `ExpandedDataPanel`
- Compute `analysisData` via `useMemo` from selected build, enriched builds, etc.
- Render `<ExpandedDataPanel>` below the selected build preview section

## Decisions
- **Damage Splits** → Replaced by "DMG Stat Contribution" bar chart (no per-action data available)
- **Panel placement** → Below the selected build preview (same as HSR: after grid, after build preview)
- **Teammate Upgrades** → Show teammate stats & buffs only (no swap suggestions)

## Verification
Run `bun run mini-ci` after implementation.
