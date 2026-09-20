# Buff Naming Guide

How buff names are displayed in the character UI sheet, and when to auto-generate vs use explicit locale keys.

## Overview

Buff names come from one of two sources:

1. **Auto-generated** — derived from the buff's tag via `TagDisplay` (used by `fieldForBuff`)
2. **Explicit** — locale key from `char_{Key}.json` (used for character-specific names)

## Auto-Generation (`fieldForBuff`)

```tsx
fieldForBuff(buff.core_crit_) // renders "CRIT Rate"
fieldForBuff(buff.m1_electric_resIgn_) // renders "Electric Res Ignore"
```

### How it works (`TagDisplay` → `TagStrDisplay`)

1. **Stat key lookup** — `tag.q` is matched against `statKeyTextMap`:

   | Tag `q` | Renders as |
   |---|---|
   | `crit_` | CRIT Rate |
   | `crit_dmg_` | CRIT DMG |
   | `dmg_` | DMG Bonus |
   | `atk_` | ATK |
   | `atk` | ATK |
   | `hp_` | HP |
   | `def_` | DEF |
   | `defIgn_` | DEF Ignore |
   | `resIgn_` | Res Ignore |
   | `dazeInc_` | Daze |

2. **Element + damage type prefix** — if tag has `attribute`, `damageType1`, or `damageType2`, they prepend:

   `{ attribute: 'electric', q: 'dmg_' }` → `"Electric DMG Bonus"`

   `{ attribute: 'physical', damageType1: 'basic', q: 'dmg_' }` → `"Physical Basic DMG Bonus"`

3. **Label map** — common suffixes get short labels via `labelMap`:

   | `q` | Label |
   |---|---|
   | `dmg_` | DMG |
   | `common_dmg_` | DMG |
   | `defIgn_` | DEF Ignore |
   | `resIgn_` | Res Ignore |
   | `dazeInc_` | Daze |
   | `sheer_dmg_` | Sheer DMG |

4. **Extra handling stats** — `hp`, `hp_`, `atk`, `atk_`, `def`, `def_` get `qt` prefix: `"Flat ATK"`, `"Percent ATK"`.

### When auto-generation works well

- Standard stat buffs: CRIT Rate, CRIT DMG, ATK, DEF, HP
- Elemental DMG bonuses: "Electric DMG Bonus", "Physical DMG Bonus"
- Penetration/resistance: "DEF Ignore", "Electric Res Ignore"
- Daze, Sheer DMG

## Explicit Locale Names

```tsx
{ title: ch('core_corrodeBone_dmg_'), fieldRef: buff.core_corrodeBone_dmg_.tag }
```

### When to use explicit names

| Situation | Example | Why |
|---|---|---|
| Unique character mechanic | "Corrode Bone Additional DMG" | Auto-gen would say "Electric DMG Bonus" — too generic |
| Short abbreviation | "CD", "CR", "AP", "AM to IMP" | Auto-gen would say "CRIT DMG", "CRIT Rate", etc. |
| Header-style group labels | "HP to CR", "SF to ATK" | These aren't stat names at all |
| Conditional labels (toggle text) | "Ether Veil State · CRIT DMG" | Always locale-driven |

### When to use `header` vs `title`

| Element | Purpose | Examples |
|---|---|---|
| `header` | Group label above a set of fields | `"DMG"`, `"Daze"`, `"CR"`, `"CD"`, `"AP"` |
| `title` (in `header`) | The visible group label text | Same text, shown as section heading |
| `title` (in `field`) | Individual buff name | "Corrode Bone Additional DMG" |

### Header rules

- **If a `fields` doc has only one field** and the field title is the same as the group label: set `header` text to the group label, use `fieldForBuff` for the field (auto-generates the field name).
- **If a `fields` doc has multiple fields**: `header` is the common group label, each field names itself (auto-generated or explicit).
- **Header without locale key**: inline string literal for common words: `header: { icon: <></>, text: 'DMG' }`

## Conditional label format

Conditional labels (toggle text) follow a consistent style:

```
"<trigger/state> · <effect>"
```

Examples:
- `"Special / EX Special Used · DMG"` — trigger first, effect after `·`
- `"Ether Veil State · CRIT DMG"` — state first
- `"Sunflare State · ER & DMG"`
- `"Off-Field State · RES Ignore"`
- `"Final Verdict Charge · Flat DMG"`

Keep labels short — they're toggle switch text in a compact UI. Use `·` (middle dot, `\u00B7`) to separate the trigger/state from the effect. Use `&` for multiple effects.

## Locale key categories in `char_{Key}.json`

| Suffix | Purpose | Example |
|---|---|---|
| `Cond` | Conditional toggle label | `"etherVeilCond": "Ether Veil State · CRIT DMG"` |
| _none_ | Field title or header | `"core_corrodeBone_dmg_": "Corrode Bone Additional DMG"` |
| `_header` | Group header | `"core_header": "HP to SF"`, `"m6_header": "RES Ignore"` |

## Decision Tree

```
Is this a conditional toggle label?
  → YES: always use ch('keyCond') as label
  → NO: continue

Is auto-generated name from the tag sufficient and clear?
  → YES: use fieldForBuff(buff.xxx)
  → NO: continue

Does this field need a short abbreviation or character-specific name?
  → YES: use { title: <ColorText...>{ch('key')}</ColorText>, fieldRef: buff.key.tag }
  → NO: continue

Is this the first field (i=0) in a fields doc?
  → YES: if no header, group title auto-generates from tag
         if header exists, group title = header text, field auto-generates
         Keep header minimal, use fieldForBuff for the field
  → NO: title is always explicit

Does the doc need a group header?
  → YES: add header: { icon, text } and use fieldForBuff for fields
  → NO: leave fields doc without header
```

## Concrete Pattern from Codebase

### Auto-generated (inside conditionals, multi-field docs with header)

```tsx
// In conditional — auto-gen handles element+damage type
conditional: {
  label: ch('etherVeilCond'),
  fields: [fieldForBuff(buff.core_etherVeil_crit_dmg_)],
}

// In fields doc WITH header — use fieldForBuff (auto-gen field name)
{
  type: 'fields',
  header: { icon: <></>, text: 'DMG' },
  fields: [
    fieldForBuff(buff.ability_wind_dmg_), // auto-gen: "Wind DMG"
    fieldForBuff(buff.ability_vortex_dmg_),
  ],
}
```

### Explicit (single-field docs, unique mechanics)

```tsx
// Fields doc WITHOUT header — single field, needs locale text
// Before: auto-generated group title from TagDisplay (when no header)
// After: add minimal header, use fieldForBuff
{
  type: 'fields',
  header: { icon: <></>, text: ch('core_anomProf') }, // group: "AP"
  fields: [fieldForBuff(buff.core_anomProf)],         // field: auto-gen
}

// Unique named buff with colored text
{
  type: 'fields',
  fields: [{
    title: <ColorText color={getVariant(buff.m2_serpentsKiss_dmg_.tag)}>
      {ch('m2_serpentsKiss_dmg_')}
    </ColorText>,
    fieldRef: buff.m2_serpentsKiss_dmg_.tag,
  }],
}
```

## W-Engine Sheets

W-engine sheets follow the same conventions but with some differences:

### Locale keys in `wengine_{Key}.json`

Same `Cond` suffix convention: `cond` → `"<trigger>Cond"`.

| Old | New | Example value |
|---|---|---|
| `cond` | `windExStacksCond` | `"Wind EX Stacks · Vortex & Windswept DMG, Squad AP"` |
| `cond` | `energyConsumedCond` | `"20 Energy Consumed · Electric DEF Ignore"` |
| `cond_stacks` | `stacksCond` | `"Ether DMG · Team DMG, Bonus AP"` |
| `activateExtendEtherVeil` | `activateExtendEtherVeilCond` | `"Ether Veil Active · Team CRIT DMG"` |

### `tagToTagField` vs `fieldForBuff`

Use `tagToTagField` (from `../../util`) in w-engine sheets — it's the w-engine equivalent of `fieldForBuff` (which lives in the char `sheetUtil`). Both auto-generate names via `TagDisplay`:

```tsx
import { tagToTagField, trans } from '../../util'

tagToTagField(buff.squadDmg_.tag)     // auto-gen: "DMG"
tagToTagField(buff.anomalyProf.tag)   // auto-gen: "Anomaly Proficiency"
```

`fieldForBuff` additionally passes `team` from the buff; `tagToTagField` does not.

### Header pattern for w-engine passives

```tsx
{
  type: 'fields',
  header: { icon: <></>, text: ch('anomProf') },  // or ch('passive_header')
  fields: [tagToTagField(buff.anomalyProf.tag)],
}
```

The `icon: <></>` is the standard empty icon placeholder.

### Phase description overrides

When a w-engine's phase description covers multiple effects (both passive and conditional), split the description into override functions in `WEngineConditionalsDisplay.tsx`:

```tsx
/** Self AP portion (first sentence). */
function WengineSelfDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Key_gen')
  const fullDesc = t(`wengine_Key_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf('. ')
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx + 1)} />
}

/** Conditional portion (from "When" to end). */
function WengineCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Key_gen')
  const fullDesc = t(`wengine_Key_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf('When ')
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(idx)} />
}
```

Register them in both the `groupDescOverride` chain (for passive groups) and the `descriptionOverride` chain (for conditionals), keyed by `wengineKey`:

```tsx
// In groupDescOverride chain:
wengineKey === 'Key' && firstFieldName === 'buffName' ? (
  <WengineSelfDesc phase={phase} />
) : ...

// In conditional descriptionOverride chain:
wengineKey === 'Key' && condName === 'cond_name' ? (
  <WengineCondDesc phase={phase} />
) : ...
```

## Edge Cases

### First field (i=0) in a `fields` doc

- **No header**: group title is auto-generated from `TagDisplay` (first field's tag)
- **With header**: group title = header text, first field shows its own title

When you add a header to a single-field doc, change the field from explicit `{title, fieldRef}` to `fieldForBuff(buff.xxx)` so the buff name auto-generates and doesn't duplicate the header text.

### ColorText wrapping

Always wrap explicit titles in `<ColorText>` when the buff has an element attribute:

```tsx
title: <ColorText color={getVariant(buff.xxx.tag)}>{ch('xxx')}</ColorText>
```

`getVariant` returns the element color if the tag has an `attribute` property, `undefined` otherwise. This makes element-typed buffs visually tinted.
