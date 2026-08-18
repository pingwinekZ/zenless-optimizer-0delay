# W-Engine Formula-UI Refactor Guide

Based on the w-engine refactor in commit `db26ed9` (worked examples: **SeveredInnocence** and **SpectralGaze**).

This guide covers the three layers a w-engine refactor touches:

| # | Layer | Path | Auto-gen? |
|---|-------|------|-----------|
| 1 | UI sheet | `app/src/formula-ui/wengine/sheets/<WEngine>.tsx` | No |
| 2 | Display component | `app/src/page-optimize/Optimize/WEngineConditionalsDisplay.tsx` | No |
| 3 | Localization | `app/src/localization/assets/locales/en/wengine_<WEngine>.json` | No |

For the full w-engine refactor (formula data, `gen-file` meta, `addOnce`/`showSpecialtyAndEquipped`), see Part B of `app/src/formula-ui/char/doc/refactor-guide.md`. This guide focuses on the **formula-ui + display + localization** pass, which is usually the last step and often the only one needed for an already-working w-engine.

Reference the worked examples alongside this guide:

- `app/src/formula-ui/wengine/sheets/SeveredInnocence.tsx`
- `app/src/formula-ui/wengine/sheets/SpectralGaze.tsx`
- `app/src/page-optimize/Optimize/WEngineConditionalsDisplay.tsx`
- `app/src/localization/assets/locales/en/wengine_SeveredInnocence.json`
- `app/src/localization/assets/locales/en/wengine_SpectralGaze.json`

---

## Part 1 — UI Sheet (`<WEngine>.tsx`)

### 1.1 Drop `mappedStats` / hardcoded field values

If the sheet only displayed datamine values (e.g. a `Duration` field) that are already visible in the phase description, remove the `mappedStats` import, the `dm` handle, and the hardcoded field:

```tsx
// ❌ BEFORE:
import { mappedStats } from '../../../stats'
...
const dm = mappedStats.wengine[key]
...
conditional: {
  label: ch('cond'),
  metadata: cond.basicSpecialAftershockHit,
  fields: [
    tagToTagField(buff.crit_dmg_.tag),
    tagToTagField(buff.electric_dmg_.tag),
    {
      title: 'Duration', // TODO: L10n,
      fieldValue: dm.duration,
    },
  ],
}

// ✅ AFTER:
// (no mappedStats import, no `const dm = ...`)
conditional: {
  label: ch('basicSpecialAftershockHitCond'),
  metadata: cond.basicSpecialAftershockHit,
  fields: [
    tagToTagField(buff.crit_dmg_.tag),
    tagToTagField(buff.electric_dmg_.tag),
  ],
}
```

Rules of thumb:

- `{ title: '...', fieldValue: dm.xxx }` fields are hardcoded strings and can't be localized — remove them unless the value isn't shown in the phase description text.
- Keep `dm` only if the sheet actually computes something from it (it usually doesn't — `tagToTagField` renders the tag directly).

### 1.2 Add a header to single-field `fields` docs

A lone `fields` doc renders an orphaned stat. Give it a header so it reads as a group. SeveredInnocence's passive CRIT DMG field:

```tsx
// ❌ BEFORE:
{
  type: 'fields',
  fields: [tagToTagField(buff.passive_crit_dmg_.tag)],
}

// ✅ AFTER:
{
  type: 'fields',
  header: { icon: null, text: ch('passive_crit_dmg_') },
  fields: [tagToTagField(buff.passive_crit_dmg_.tag)],
}
```

- `icon: null` for a header without an icon (the standard empty placeholder).
- The header text comes from the locale file (`ch('passive_crit_dmg_')` → `"CD"`).
- The field itself stays `tagToTagField(...)` — auto-generated name, no duplication.

### 1.3 Rename generic conditional labels

Replace generic keys (e.g. `cond`) with descriptive `...Cond` keys so the toggle text is meaningful (SeveredInnocence):

```tsx
// ❌ BEFORE: label: ch('cond')
// ✅ AFTER:  label: ch('basicSpecialAftershockHitCond')
```

Naming pattern: `<trigger/state>Cond`, e.g. `basicSpecialAftershockHitCond`, `offFieldCond`, `exFireStacksCond`, `stacksCond`.

If the key rename is out of scope, at minimum shorten the values (SpectralGaze kept `cond1`/`cond2` keys — see 3.2).

---

## Part 2 — Display Component (`WEngineConditionalsDisplay.tsx`)

The optimize page renders each w-engine's phase description in hover cards. When a w-engine's phase description covers **multiple effects** (e.g. a passive stat AND a conditional buff), the full description no longer fits either hover card, so the component provides per-w-engine description helpers.

### 2.1 Description helper factories

Two factory helpers already exist at the top of `WEngineConditionalsDisplay.tsx`:

```tsx
/** First sentence of the phase description (up to the first ". "). */
function firstSentenceDesc(ns: string) {
  return function Desc({ phase }: { phase: number }) {
    const { t } = useTranslation(ns)
    const fullDesc = t(`${ns}:phaseDescs.${phase - 1}`)
    const idx = fullDesc.indexOf('. ')
    if (idx === -1) return <GameText text={fullDesc} />
    return <GameText text={fullDesc.slice(0, idx + 1)} />
  }
}

/** From the given marker text (e.g. "When ") to the end of the description. */
function fromMarkerDesc(ns: string, marker: string) {
  return function Desc({ phase }: { phase: number }) {
    const { t } = useTranslation(ns)
    const fullDesc = t(`${ns}:phaseDescs.${phase - 1}`)
    const idx = fullDesc.indexOf(marker)
    if (idx === -1) return <GameText text={fullDesc} />
    return <GameText text={fullDesc.slice(idx)} />
  }
}
```

Instantiate them per w-engine:

```tsx
/** CRIT DMG portion of SeveredInnocence's phase description (first sentence). */
const SeveredInnocenceCritDesc = firstSentenceDesc('wengine_SeveredInnocence_gen')

/** Conditional portion of SeveredInnocence's phase description (from "When" to end). */
const SeveredInnocenceCondDesc = fromMarkerDesc('wengine_SeveredInnocence_gen', 'When ')
```

**Custom slice** — if neither factory fits (e.g. you need a middle slice or a marker-based endpoint), write an inline function. SpectralGaze's DEF Reduction is the first two sentences, ending at a stable marker:

```tsx
/** DEF Reduction portion of SpectralGaze's phase description (first two sentences). */
function SpectralGazeDefRedDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_SpectralGaze_gen')
  const fullDesc = t(`wengine_SpectralGaze_gen:phaseDescs.${phase - 1}`)
  const marker = 'Passive effects of the same name do not stack.'
  const idx = fullDesc.indexOf(marker)
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx + marker.length)} />
}
```

### 2.2 Wire into the passive-group override chain

For `fields` docs (passive groups), add a branch to the `groupDescOverride` chain, keyed by `wengineKey` + the first field's buff name:

```tsx
const groupDescOverride: ReactNode | undefined =
  ...
  ) : wengineKey === 'SeveredInnocence' &&
    firstFieldName === 'passive_crit_dmg_' ? (
    <SeveredInnocenceCritDesc phase={phase} />
  ) : undefined
```

### 2.3 Wire into the conditional override chain

For `conditional` docs, add a branch to the `descriptionOverride` chain on `WengineConditionalRow`, keyed by `wengineKey` + `condName`:

```tsx
descriptionOverride={
  ...
  ) : wengineKey === 'SeveredInnocence' &&
    condName === 'basicSpecialAftershockHit' ? (
    <SeveredInnocenceCondDesc phase={phase} />
  ) : wengineKey === 'SpectralGaze' &&
    condName === 'hit_aftershock_electric' ? (
    <SpectralGazeDefRedDesc phase={phase} />
  ) : undefined
}
```

### 2.4 Hide self-only conditionals from the teammate view

If a conditional's buff is self-only (e.g. SpectralGaze's `spiritLock` gives the equipper Impact — it does not affect teammates), hide the toggle when rendering for a teammate. Add a branch to the `condEntries.filter(...)` block:

```tsx
// SpectralGaze: Spirit Lock stacks are self-only, hide from teammate view
if (
  wengineKey === 'SpectralGaze' &&
  condName === 'spiritLock' &&
  teammateKey
) {
  return false
}
```

Existing examples of this pattern: `ChiefSidekick`/`YesterdayCalls`/`Thoughtbop` `offField`, `Metanukimorphosis` `physical_exSpecial_ult`.

---

## Part 3 — Localization (`wengine_<WEngine>.json`)

### 3.1 Conditional keys → descriptive `...Cond` keys

SeveredInnocence renamed its generic `cond` key:

```json
// ❌ BEFORE:
{
  "cond": "Buff Stacks"
}

// ✅ AFTER:
{
  "passive_crit_dmg_": "CD",
  "basicSpecialAftershockHitCond": "Basic / Special / Aftershock Hit · CD & DMG"
}
```

- Conditional keys end with `Cond`; label format is `"<trigger/state> · <effect>"` (middle dot, `&` between effects).
- New header/field title keys use the buff name directly (`passive_crit_dmg_` → `"CD"`).

### 3.2 Short, scannable values (keep `cond1`/`cond2` style keys if renaming is out of scope)

SpectralGaze kept its `cond1`/`cond2` keys but shortened the values from full sentences to compact toggle labels:

```json
// ❌ BEFORE:
{
  "cond1": "When the equipper hits an enemy with an Aftershock, causing Electric DMG",
  "cond2": "Spirit Lock Stacks"
}

// ✅ AFTER:
{
  "cond1": "Electric Aftershock Hit · DEF Reduction",
  "cond2": "Spirit Lock · Impact"
}
```

These are toggle switch texts in a compact UI — keep them short, `<trigger> · <effect>`.

---

## Part 4 — Step-by-Step Checklist

For each w-engine, in order:

- [ ] **1. UI sheet** — remove `mappedStats`/`dm` if unused; remove hardcoded `{ title: '...', fieldValue: dm.xxx }` fields; add `header: { icon: null, text: ch('...') }` to single-field `fields` docs; rename `cond`/`cond1`/`cond2` labels to descriptive `...Cond` keys.
- [ ] **2. Localization** — add/rename keys: `...Cond` for conditionals, bare buff-name keys for headers/field titles; keep values short (`"<trigger> · <effect>"`).
- [ ] **3. Display component** — if the phase description covers multiple effects, add `firstSentenceDesc`/`fromMarkerDesc` (or a custom slice) helpers and wire them into both override chains (`groupDescOverride` for passives, `descriptionOverride` for conditionals).
- [ ] **4. Teammate view** — if any conditional is self-only, hide it in the teammate filter (`wengineKey === 'X' && condName === 'y' && teammateKey`).
- [ ] **5. Format** — `bun biome check --write --formatter-enabled=true --linter-enabled=false --assist-enabled=true`
- [ ] **6. Typecheck** — `npx nx run-many --target=typecheck`
- [ ] **7. Lint** — `npx nx run-many --target=eslint:lint --max-warnings=0`
- [ ] **8. Test** — `npx nx run-many --target=test`

---

## Part 5 — Common Pitfalls

- **Leaving an unused `mappedStats` import** — after removing the `dm.duration` field, drop both the import and `const dm = ...` or the linter (unused-imports) fails.
- **Header/field duplication** — when you add a header to a single-field doc, keep the field as `tagToTagField(buff.xxx)`; don't add an explicit `{ title: ch('xxx'), ... }` that repeats the header text.
- **Missing `Cond` suffix** — conditional labels must resolve through `...Cond` keys; the display falls back to the raw conditional name otherwise.
- **Override chain ordering** — new branches go at the end of the ternary chains in `groupDescOverride` / `descriptionOverride` / the teammate filter; keep keys (`wengineKey`, `firstFieldName`, `condName`) exact — a mismatch silently falls through to the default full description.
- **Marker-based slices are brittle** — choose stable English markers (e.g. `'Passive effects of the same name do not stack.'`, `'When '`). Helpers already fall back to the full description when the marker is missing, so a missing marker degrades gracefully, but the slice will be wrong if the sentence structure changes. If a more robust approach is needed, use the `GameDescSlice`/`sliceBetween` helpers in `app/src/i18n/` (introduced in the same commit for character sheets).
