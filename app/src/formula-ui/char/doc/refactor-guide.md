# Formula & UI Refactor Guide

This guide covers refactoring a character's **formula data** (`app/src/formula/data/char/sheets/<Char>.ts`), its **UI sheet** (`app/src/formula-ui/char/sheets/<Char>.tsx`), and its **localization file**.

The worked example is **Seed** — already fully refactored and exercising every pattern in this guide:

- `app/src/formula/data/char/sheets/Seed.ts`
- `app/src/formula-ui/char/sheets/Seed.tsx`
- `app/src/localization/assets/locales/en/char_Seed.json`

Read those three files alongside this guide. All snippets below are taken verbatim from them.

## The 4 layers

| # | Layer | Path | Auto-gen? |
|---|-------|------|-----------|
| 1 | Formula data | `app/src/formula/data/char/sheets/<Char>.ts` | No |
| 2 | Meta (buffs/conditionals/formulas) | `app/src/formula/meta/char/<Char>/*.ts` | Yes (`gen-file`) |
| 3 | UI sheet | `app/src/formula-ui/char/sheets/<Char>.tsx` | No |
| 4 | Localization | `app/src/localization/assets/locales/en/char_<Char>.json` | No |

---

## Part 1 — Formula data (`Seed.ts`)

### 1.1 Conditionals

**Bool conditionals** (toggles) come from `allBoolConditionals`. The 3rd arg maps conditional name → mindscape requirement (the toggle is hidden until that mindscape is reached):

```ts
const {
  directStrike,
  onslaught_atk,
  besiege,
  besiege_defIgn,
  besiege_ult_dmg,
} = allBoolConditionals(key, undefined, {
  besiege_defIgn: 2, // only exists at M2
  besiege_ult_dmg: 4, // only exists at M4
})
```

**Num conditionals** (sliders) come from `allNumConditionals(key, intOnly, min, max)`:

```ts
const { energy_consumed } = allNumConditionals(
  key,
  true, // int only
  0,
  dm.m2.max_energy_consumed - dm.m2.energy_consumed // max = 60
)
```

### 1.2 Buff registration — `registerBuff`

```ts
registerBuff(
  name,                        // must match the `buff.<name>` key used in the UI sheet
  entries,                     // TagMapNodeEntry | TagMapNodeEntry[]
  cond = 'infer',              // reader condition ('infer' is almost always fine)
  team = false,                // true → listed team-wide (shows in teammate view)
  includeOriginalEntry = true, // false → buff only applies where explicitly wired in (see 1.3)
)
```

### 1.3 Skill-scoped buffs — "apply to specific attacks only"

When a buff affects **only some attacks** (not every hit of its damage type), it must be:

1. created with `addWithDmgType('<dmgType>', ...)` (tags it with `damageType1`/`damageType2`),
2. wired into **exactly those hits** via `dmgDazeAndAnomOverride` extras,
3. registered with `includeOriginalEntry: false` so it isn't ALSO applied globally (which would wrongly buff every skill of that damage type).

Seed's ability buffs hit `Falling Petals - Slaughter` and `Falling Petals - Downfall` but NOT the physical first hits of `Chrysanthemum`:

```ts
const ability_basic_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  abilityCheck(percent(dm.ability.basic_ult_dmg_))
)
const ability_basic_electric_resIgn_ =
  ownBuff.combat.resIgn_.electric.addWithDmgType(
    'basic',
    abilityCheck(percent(dm.ability.electric_resIgn_))
  )
```

Wired into the affected hits as extras (`...` spread — `addWithDmgType` returns an array):

```ts
dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackFallingPetalsSlaughter',
  0,
  { ...baseTag, damageType1: 'basic' },
  'atk',
  undefined,
  ...ability_basic_dmg_,
  ...ability_basic_electric_resIgn_
),
dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackFallingPetalsDownfallFirstForm',
  0,
  { ...baseTag, damageType1: 'basic' },
  'atk',
  undefined,
  ...ability_basic_dmg_,
  ...ability_basic_electric_resIgn_,
  ...m1_basic_crit_dmg_ // M1 only hits Downfall, not Slaughter
),
```

Registered with the 5th param `false`:

```ts
registerBuff('ability_basic_dmg_', ability_basic_dmg_, undefined, undefined, false)
registerBuff('ability_basic_electric_resIgn_', ability_basic_electric_resIgn_, undefined, undefined, false)
registerBuff('m1_basic_crit_dmg_', m1_basic_crit_dmg_, undefined, undefined, false)
```

Contrast with the **ultimate** buff: it applies to ALL ult damage (Seed has one ult), so it's registered normally (default `includeOriginalEntry: true`) and needs no overrides:

```ts
registerBuff(
  'ability_ult_dmg_',
  ownBuff.combat.dmg_.addWithDmgType(
    'ult',
    abilityCheck(percent(dm.ability.basic_ult_dmg_))
  )
)
```

Rule of thumb: if a buff affects every hit of its damage type → normal `registerBuff`. If it affects only selected hits → extras in `dmgDazeAndAnomOverride` + `includeOriginalEntry: false`.

### 1.4 Teammate-targeted buffs — `notOwnBuff` + `team: true`

Buffs granted to another agent (Seed's Vanguard) are built on `notOwnBuff` and registered with `team: true` so they show up in the teammate's view:

```ts
registerBuff(
  'core_vanguard_atk',
  notOwnBuff.combat.atk.add(
    directStrike.ifOn(subscript(char.core, dm.core.direct_strike_atk))
  ),
  undefined,
  true // team
),
registerBuff(
  'm2_vanguard_defIgn_',
  notOwnBuff.combat.defIgn_.add(
    cmpGE(char.mindscape, 2, besiege_defIgn.ifOn(percent(dm.m2.besiege_defIgn_)))
  ),
  undefined,
  true
),
```

Self buffs use `ownBuff` + default `team: false`. Note `core_dmg_` — Besiege buffs BOTH Seed and the Vanguard — is still written with `ownBuff.combat.common_dmg_` but registered `team: true` so it lists team-wide.

### 1.5 Mindscape-gated conditionals — `cmpGE` + `ifOn`

Always-on M stats need no conditional; toggleable M effects combine `cmpGE(char.mindscape, N, ...)` with `cond.ifOn(...)`:

```ts
registerBuff(
  'm2_defIgn_',
  ownBuff.combat.defIgn_.add(
    cmpGE(char.mindscape, 2, besiege_defIgn.ifOn(percent(dm.m2.besiege_defIgn_)))
  )
),
```

Compare `m6_crit_dmg_`, an always-on M6 stat → plain `cmpGE`, no conditional:

```ts
registerBuff(
  'm6_crit_dmg_',
  ownBuff.combat.crit_dmg_.add(
    cmpGE(char.mindscape, 6, percent(dm.m6.crit_dmg_))
  )
)
```

### 1.6 Formula damage — `customDmg` + matching `registerBuff`

`customDmg` registers an optimization-target formula (M6's Additional Laser DMG). It MUST be paired with a `registerBuff` of the same name, or the sheet display filter (which looks up `buffs[name]`) won't render the field:

```ts
...customDmg(
  'm6_dmg',
  { damageType1: 'elemental' },
  cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.dmg)))
),
registerBuff(
  'm6_dmg',
  ownBuff.combat.dmg_.addWithDmgType(
    'elemental',
    cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
  ),
  undefined,
  undefined,
  false
),
```

### 1.7 Per-hit element/damage-type overrides

Hits that differ from the default (e.g. physical instead of electric) get their own `dmgDazeAndAnomOverride`:

```ts
// Basic Attack Chrysanthemum 1-2 hits are physical
dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackChrysanthemumWheelDance',
  0,
  { damageType1: 'basic' }, // no attribute → defaults to physical
  'atk'
),
```

---

## Part 2 — Meta files (generated)

`buffs.ts`, `conditionals.ts`, `formulas.ts` under `app/src/formula/meta/char/<Char>/` are generated. After editing the data file, regenerate:

```bash
bun nx run-many -t gen-file
```

The generated `conditionals.ts` picks up `mindscapeRequirement` and num min/max automatically; `buffs.ts` derives `team` from the `registerBuff` 4th param. No manual edits needed.

---

## Part 3 — UI sheet (`Seed.tsx`)

### 3.1 The one rule: group by effect

A **document** in the sheet = one in-game effect (one description paragraph):

- All buffs of the same effect are **fields inside one document**, even if they are different stats. Onslaught gives ATK + CRIT DMG → one conditional with two fields.
- Two buffs from the same section that come from **different effects get separate documents**. M6 CRIT DMG and M6 Additional DMG are both M6 but live in two separate `fields` docs.
- Toggleable effects → `conditional` docs. Always-on effects → `fields` docs with a header.

### 3.2 Conditional doc — one effect, two buffs

```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('onslaughtAtkCond'), // "Onslaught · ATK & CD"
    description: <CoreGameDesc characterKey={key} paragraph={1} />,
    metadata: cond.onslaught_atk,
    fields: [
      fieldForBuff(buff.core_atk),
      fieldForBuff(buff.core_crit_dmg_),
    ],
  },
},
```

- `label` — localized toggle name (`ch('xxxCond')`).
- `description` — the effect text (see 3.8 for which desc component to use).
- `metadata` — the conditional read from `cond` (`Seed.conditionals`).
- `fields` — every buff this effect grants, in one list.

### 3.3 Linked conditionals — one effect split across sections

When one effect grants buffs in **different sections** (Core, M2, M4), each section gets its own `conditional` doc, but all toggles share state via `linked`. Besiege is one effect split across Core/M2/M4:

```tsx
// core — Besiege · DMG
{
  type: 'conditional',
  conditional: {
    label: ch('besiegeCond'),
    description: <CoreGameDesc characterKey={key} paragraph={2} />,
    metadata: cond.besiege,
    fields: [fieldForBuff(buff.core_dmg_)],
    linked: ['besiege_defIgn', 'besiege_ult_dmg'],
  },
},
// m2 — Besiege · DEF Ign (linked back)
{
  type: 'conditional',
  conditional: {
    label: ch('besiegeDefIgnCond'),
    description: <GameDesc ns="char_Seed_gen" key18="mindscapes.2.desc" />,
    metadata: cond.besiege_defIgn,
    fields: [/* m2_defIgn_, m2_vanguard_defIgn_ */],
    linked: ['besiege', 'besiege_ult_dmg'],
  },
},
// m4 — Besiege · DMG (linked back)
{
  type: 'conditional',
  conditional: {
    label: ch('besiegeUltDmgCond'),
    description: <GameDesc ns="char_Seed_gen" key18="mindscapes.4.desc" />,
    metadata: cond.besiege_ult_dmg,
    fields: [/* m4_ult_dmg_ */],
    linked: ['besiege', 'besiege_defIgn'],
  },
},
```

Requirements:

- Every linked name exists in the **same `allBoolConditionals` call** in the data file (1.1).
- The `linked` arrays are **symmetric** — each conditional lists all the others.
- The link refers to conditional names, not buff names.

### 3.4 Num conditional — slider

A num conditional uses the same `conditional` doc; the display switches to a slider based on the metadata type:

```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('m2EnergyConsumedCond'), // "Energy Consumed · DMG"
    description: <GameDesc ns="char_Seed_gen" key18="mindscapes.2.desc" />,
    metadata: cond.energy_consumed,
    fields: [
      {
        title: (
          <ColorText color={getVariant(buff.m2_basic_dmg_.tag)}>
            {ch('ability_basic_dmg_')} // reuses the Slaughter DMG name
          </ColorText>
        ),
        fieldRef: buff.m2_basic_dmg_.tag,
      },
    ],
  },
},
```

The slider's min/max/int-only come from the generated `conditionals.ts` metadata — no UI config needed. Reusing an existing locale key is fine when the field is the same buff shown elsewhere (here M2's energy bonus boosts the next Slaughter).

### 3.5 Targeted conditionals — buffs applied to a teammate

When the conditional's buffs land on another agent (the Vanguard), set `targeted: true` so the toggle gets a target selector:

```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('directStrikeCond'),
    description: <CoreGameDesc characterKey={key} paragraph={1} />,
    metadata: cond.directStrike,
    fields: [
      fieldForBuff(buff.core_vanguard_atk),
      fieldForBuff(buff.core_vanguard_crit_dmg_),
    ],
    targeted: true,
  },
},
```

The matching data buffs are `notOwnBuff` + `team: true` (see 1.4).

### 3.6 Fields docs & headers — always-on effects

Always-on effects are `fields` docs. The header names the effect/section; the fields list its buffs:

```tsx
// m6 — one effect per doc:
{
  type: 'fields',
  header: { icon: null, text: ch('m6_header') }, // "CD" — M6 CRIT DMG effect
  fields: [fieldForBuff(buff.m6_crit_dmg_)],
},
{
  type: 'fields',
  header: { icon: null, text: ch('m6_additional_dmg') }, // "Additional DMG" — separate effect
  fields: [
    {
      title: (
        <ColorText color={getVariant(formula.m6_dmg.tag)}>
          {ch('m6_additional_laser_dmg')}
        </ColorText>
      ),
      fieldRef: formula.m6_dmg.tag, // formula tag, not a buff tag
    },
  ],
},
```

Two docs, two effects — even though both live in M6.

### 3.7 `fieldForBuff` vs custom `ColorText` fields

Two ways to build a field:

- **`fieldForBuff(buff)`** — title auto-generated from the tag (`TagDisplay`). Use when the generic name is fine ("ATK", "CRIT DMG", "Basic DMG"). Carries `team` over automatically.
- **Custom field object** — `<ColorText color={getVariant(tag)}>{ch('key')}</ColorText>` title. Use when the buff must display a **per-skill name** ("Falling Petals - Slaughter DMG", "Falling Petals - Downfall Electric RES Ignore", ...).

The same buff tag can be shown under several titles. Seed's ability buff affects Slaughter, Downfall, and the Ultimate, and the sheet renders it once per affected skill, each with its own localized name — all pointing at the same tag:

```tsx
{
  type: 'fields',
  header: { icon: null, text: ch('ability_dmg_header') }, // "DMG"
  fields: [
    {
      title: (
        <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
          {ch('ability_basic_dmg_')}
        </ColorText>
      ),
      fieldRef: buff.ability_basic_dmg_.tag,
    },
    {
      title: (
        <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
          {ch('ability_downfall_dmg_')}
        </ColorText>
      ),
      fieldRef: buff.ability_basic_dmg_.tag, // same tag, different name
    },
    // ... same pattern for electric RES Ignore (Slaughter + Downfall)
    // and the Ultimate DMG / Electric RES Ignore fields
  ],
},
```

`getVariant(tag)` returns the tag's attribute (or `undefined`), which drives the `ColorText` color — electric fields render blue.

### 3.8 Descriptions — which component

| Where | Component | Notes |
|---|---|---|
| Core effect | `<CoreGameDesc characterKey={key} paragraph={N} />` | Renders `core.desc.<level>.<N>` with the character's actual core level. `paragraph` indexes into the core-level desc (Seed: 1 = Onslaught/Direct Strike, 2 = Besiege) |
| Mindscape | `<GameDesc ns="char_Seed_gen" key18="mindscapes.N.desc" />` | Static text from the datamine locale |
| Part of a description | `<GameDescSlice ns key18 from to />` | Slices between stable text markers instead of paragraph indexes (3.10) |
| Skill ability | `<SkillGameDesc characterKey={key} ns="char_<Key>_gen" key18="<skill>.<ability>.desc" />` | Evaluates `{CAL:...}` tokens with the character's real skill levels |
| Multi-paragraph | Wrap multiple `<GameDesc>` in a fragment with `<div style={{ marginBottom: 8 }} />` between them | |

### 3.9 Imports

```tsx
import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Seed } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Seed'
const [, ch] = trans('char', key)
const cond = Seed.conditionals
const buff = Seed.buffs
const formula = Seed.formulas

const sheet = createBaseSheet(key, {
  core: [...],
  ability: [...],
  m1: [...], m2: [...], m4: [...], m6: [...],
})
```

- `ch('...')` reads from `char_<Key>.json` (the file you own); `chg('...')` would read the generated `char_<Key>_gen.json`.
- `createBaseSheet` already renders every skill's dmg/daze/anom formulas, core/ability/mindscape name+desc docs. You only add documents for conditionals, buff fields, and per-skill extras.
- Conditionals that belong to a specific skill ability (e.g. an EX Special effect) go under `perSkillAbility: { <skill>: { <ability>: [...] } }` instead of the section arrays.

### 3.10 Descriptions — slicing parts of a description

Datamine descriptions are not consistent enough to rely on paragraph indexes (`core.desc.<level>.N`): some are a single string per level, others are a dict of paragraphs, and paragraph counts change between patches. When a conditional description needs **part** of a description (e.g. the M1 stun line appended to the core passive text), use `GameDescSlice` to extract it between stable text markers instead:

```tsx
description: (
  <>
    <CoreGameDesc characterKey={key} />
    <div style={{ marginTop: 8 }}>
      M1: <GameDescSlice
        ns="char_Trigger_gen"
        key18="mindscapes.1.desc"
        from="The Stun DMG Multiplier"
        to="Soul-Searching Gaze"
      />
    </div>
  </>
),
```

- The slice starts at the first occurrence of `from` and runs **through the end of the sentence** containing the first occurrence of `to` (next `.`), preserving `<ct>` markup and number highlighting.
- Markers are stable phrases from the game text; wording changes only break the slice if the markers themselves disappear. If either marker is not found, the component renders nothing and logs a `console.warn` so stale markers are caught.
- Pair this with **merging the mindscape's value into the parent buff**: instead of a separate M1 field, fold it into the core buff with `sum(coreValue, cmpGE(char.mindscape, 1, m1Value))` and register only the parent buff. The field then shows the base value at M0 and grows once the mindscape is enabled:

```ts
registerBuff(
  'core_stun_',
  enemyDebuff.common.stun_.add(
    aftershock_hit.ifOn(
      sum(
        subscript(char.core, dm.core.stun_),
        cmpGE(char.mindscape, 1, dm.m1.stun_)
      )
    )
  )
),
```

This keeps the conditional description self-contained (core text + the relevant M line) and removes a separate mindscape section when the mindscape only augments an existing effect.

---

## Part 4 — Localization (`char_Seed.json`)

**Conditional keys** — suffix `Cond`, format `<state/trigger> · <effects>`:

```json
{
  "onslaughtAtkCond": "Onslaught · ATK & CD",
  "directStrikeCond": "Direct Strike · ATK & CD",
  "besiegeCond": "Besiege · DMG",
  "besiegeDefIgnCond": "Besiege · DEF Ign",
  "besiegeUltDmgCond": "Besiege · DMG",
  "m2EnergyConsumedCond": "Energy Consumed · DMG"
}
```

**Header keys** — referenced by `ch()` in `header.text`; no fixed suffix (Seed uses both `_header` and plain names):

```json
{
  "ability_dmg_header": "DMG",
  "m1_header": "CD",
  "m6_header": "CD",
  "m6_additional_dmg": "Additional DMG"
}
```

**Field title keys** — name the field by the skill it belongs to (key can be the buff name or anything referenced from the sheet):

```json
{
  "ability_basic_dmg_": "Falling Petals - Slaughter DMG",
  "ability_downfall_dmg_": "Falling Petals - Downfall DMG",
  "ability_basic_electric_resIgn_": "Falling Petals - Slaughter Electric RES Ignore",
  "ability_downfall_electric_resIgn_": "Falling Petals - Downfall Electric RES Ignore",
  "ability_ult_dmg_": "Clockwork Garden - Bloom! Ultimate DMG",
  "ability_ult_electric_resIgn_": "Clockwork Garden - Bloom! Electric RES Ignore",
  "m1_basic_crit_dmg_": "Falling Petals - Downfall CRIT DMG",
  "m2_defIgn_": "DEF Ignore",
  "m4_ult_dmg_": "Ultimate DMG",
  "m6_additional_laser_dmg": "Additional Laser DMG"
}
```

Never edit `char_<Key>_gen.json` — that comes from the datamine.

---

## Part 5 — Checklist

- [ ] **1. Formula data** — add conditionals (`allBoolConditionals` with mindscape requirements, `allNumConditionals` for sliders); `addWithDmgType` + `dmgDazeAndAnomOverride` extras + `includeOriginalEntry: false` for skill-scoped buffs; `notOwnBuff` + `team: true` for teammate buffs; `customDmg` paired with a matching `registerBuff`; `cmpGE(char.mindscape, N, cond.ifOn(...))` for toggleable M effects; per-hit element/damage-type overrides.
- [ ] **2. Run `bun nx run-many -t gen-file`** to regenerate `buffs.ts` / `conditionals.ts` / `formulas.ts`.
- [ ] **3. UI sheet** — group documents by effect (3.1); wire `metadata: cond.<name>`; add `linked` arrays for effects split across sections; `targeted: true` for teammate conditionals; `fieldForBuff` for generic titles, custom `ColorText` fields for per-skill names; headers on all `fields` docs; descriptions via `CoreGameDesc`/`GameDesc`/`SkillGameDesc`/`GameDescSlice` (3.8, 3.10).
- [ ] **4. Localization** — add `Cond` keys, header keys, and field title keys to `char_<Key>.json`.
- [ ] **5. Format** — `bun biome check --write --formatter-enabled=true --linter-enabled=false --assist-enabled=true`
- [ ] **6. Typecheck** — `npx nx run-many --target=typecheck`
- [ ] **7. Lint** — `npx nx run-many --target=eslint:lint --max-warnings=0`
- [ ] **8. Test** — `npx nx run-many --target=test`

---

## Part 6 — Common pitfalls

- **`customDmg` without a matching `registerBuff`** — the formula exists as an opt target but the field never renders, because the sheet display filter looks up `buffs[name]`. Always pair them (1.6).
- **Forgotten `includeOriginalEntry: false`** — skill-scoped buffs applied only via `dmgDazeAndAnomOverride` extras must set the 5th `registerBuff` param to `false`, or the buff also applies globally and over-buffs every hit of that damage type (1.3).
- **`team` mismatch** — `notOwnBuff`/`teamBuff` buffs must be registered with `team: true`; plain `ownBuff` self-buffs keep `team: false`. The generated `buffs.ts` reflects this.
- **`linked` not symmetric** — every conditional in a linked group must list all the others, and all names must come from the same `allBoolConditionals` call (3.3).
- **Missing `targeted: true`** — a conditional whose buffs apply to another agent needs `targeted: true`, or there's no way to aim the toggle at the teammate (3.5).
- **Wrong description component** — core paragraphs need `CoreGameDesc` (uses the real core level), mindscapes need `GameDesc` with `ns="char_<Key>_gen"`; skill abilities with `{CAL:...}` tokens need `SkillGameDesc` (3.8).
- **Paragraph indexes on non-dict descs** — `core.desc.<level>` is a plain string for some characters; `CoreGameDesc paragraph={N}` renders nothing in that case. When a description is not a dict of paragraphs, render the whole string (no `paragraph` prop) or use `GameDescSlice` for partial text (3.8, 3.10).
- **Missing `getVariant` / `ColorText` imports** — always add them when using custom fields.
- **Grouping by stat instead of effect** — the sheet must show one doc per effect, not one doc per stat. When in doubt, split docs when the buffs come from different descriptions (3.1).
- **Editing generated files** — `meta/char/<Char>/*.ts` are generated; hand-edits are wiped by `gen-file`.