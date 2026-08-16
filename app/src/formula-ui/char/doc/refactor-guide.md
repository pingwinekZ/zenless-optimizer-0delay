# Formula & UI Refactor Guide

Based on patterns observed across refactored characters (OrphieMagus, Yidhari, Lucia, Banyue, Norma, JoyauDore, Velina, Cissia, NangongYu, Promeia, StarlightBilly, Zhao, AstraYao, Pyrois + 10 w-engines).

Each refactor touches 6 layers per character/w-engine:

| # | Layer | Path | Auto-gen? |
|---|-------|------|-----------|
| 1 | Formula data | `app/src/formula/data/char/sheets/<Char>.ts` or `app/src/formula/data/wengine/sheets/<WEngine>.ts` | No |
| 2 | Meta buffs | `app/src/formula/meta/char/<Char>/buffs.ts` | Yes (via `gen-file`) |
| 3 | Meta conditionals | `app/src/formula/meta/char/<Char>/conditionals.ts` | Yes (via `gen-file`) |
| 4 | Meta formulas | `app/src/formula/meta/char/<Char>/formulas.ts` | Yes (via `gen-file`) |
| 5 | UI sheet | `app/src/formula-ui/char/sheets/<Char>.tsx` or `.../wengine/sheets/<WEngine>.tsx` | No |
| 6 | Localization | `app/src/localization/assets/locales/en/char_<Char>.json` or `wengine_<WEngine>.json` | No |

---

## Part A: Characters

### A1. Formula Data — What to Remove

**Remove `anomBuildup_` buffs.** These are useless because anomaly buildup is already baked into `registerAllDmgDazeAndAnom` per-skill via `customAnomalyBuildup`. Standalone `anomBuildup_` entries have no effect on optimization.

```ts
// ❌ REMOVE:
const core_anomBuildup_ = ownBuff.combat.anomBuildup_.ether.add(percent(...));
const m4_basicAnomalyBuildup_ = ownBuff.combat.anomBuildup_.ether.add(...);

registerBuff('core_anomBuildup_', core_anomBuildup_, undefined, undefined, false);
registerBuff('m4_basicAnomalyBuildup_', m4_basicAnomalyBuildup_, undefined, undefined, false);
```

Also remove them from `allAnomBuffs` / `chargedAnomBuffs` arrays that feed into `dmgDazeAndAnomOverride` extras.

**Remove `customDmg` entries** for formula-based damage instances that are no longer needed:

```ts
// ❌ REMOVE (Norma's deprecated M6 barrage damage):
...customDmg('m6_barrage_dmg', { ...baseTag, damageType1: 'ult' }, cmpGE(char.mindscape, 6, m6Barrage.ifOn(prod(own.final.atk, percent(dm.m6.missleDmg)))))
```

**Remove unused conditionals** from `allBoolConditionals`:

```ts
// ❌ BEFORE:
const { enNahBarrage, warheadHit, m6Barrage } = allBoolConditionals(key, undefined, { warheadHit: 1, m6Barrage: 6 });
// ✅ AFTER:
const { enNahBarrage, warheadHit } = allBoolConditionals(key, undefined, { warheadHit: 1 });
```

**Clean up unused/unnecessary `dazeInc_` buffs.** If a `dazeInc_` buff is a standalone buff that duplicates what `registerAllDmgDazeAndAnom` already provides per-skill, remove it. Keep `dazeInc_` buffs that add **extra** daze to specific skills via `dmgDazeAndAnomOverride` extras (see A2).

**DO NOT remove `anom_mv_mult_` buffs.** These modify anomaly damage formula multipliers and are legitimate buffs. Only remove `anomBuildup_`.

### A2. Formula Data — What to Add/Change

**Wrap conditional buffs in bool conditionals** with `mindscapeRequirement`:

```ts
const { m1ResIgn } = allBoolConditionals(key, undefined, {
  m1ResIgn: 1, // mindscapeRequirement
});

registerBuff('m1_resIgn_',
  ownBuff.combat.resIgn_.add(
    m1ResIgn.ifOn(cmpGE(char.mindscape, 1, percent(dm.m1.resDecrease)))
  ),
  undefined, true // team: true
);
```

**Use `teamBuff` for team-wide buffs** — 4th param to `registerBuff` = `true`:

```ts
const m1_wind_resIgn_ = teamBuff.combat.resIgn_.wind.add(...)
registerBuff('m1_wind_resIgn_', m1_wind_resIgn_, undefined, true)
```

**Use `dmgDazeAndAnomOverride`** to add extra daze/damage buffs to specific skill hits:

```ts
const ability_sweepingCyclone_dazeInc_ = ownBuff.combat.dazeInc_.add(ability_check(percent(dm.ability.daze_)));
const m1_sweepingCyclone_dazeInc_ = ownBuff.combat.dazeInc_.add(cmpGE(char.mindscape, 1, percent(dm.m1.sweepingCycloneDaze)));

registerBuff('ability_sweepingCyclone_dazeInc_', ability_sweepingCyclone_dazeInc_);
registerBuff('m1_sweepingCyclone_dazeInc_', m1_sweepingCyclone_dazeInc_, undefined, undefined, false);

// Pass into registerAllDmgDazeAndAnom as extras:
...registerAllDmgDazeAndAnom(key, dm,
  dmgDazeAndAnomOverride(dm, 'special', 'SweepingCyclone', 0,
    { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
    'atk',
    undefined, // arg — no condition here
    ability_sweepingCyclone_dazeInc_,
    m1_sweepingCyclone_dazeInc_
  ),
);
```

**Use `customDmg` for new formula-based damage** (like Cissia's Corrode Bone Additional DMG):

```ts
// In data file:
...customDmg('core_corrodeBone_dmg_', { ...baseTag, attribute: 'electric' },
  prod(own.final.atk, corrodeBoneDmg)
)

// Reference via Cissia.formulas in the UI:
const formula = Cissia.formulas;
// Use: fieldRef: formula.core_corrodeBone_dmg_.tag
```

**Also add a matching `registerBuff`** with the same name. `customDmg` only registers a formula (visible as an optimization target), but the sheet display filter looks up `buffs[name]` to decide whether to show the field value:

```ts
registerBuff(
  'core_corrodeBone_dmg_',
  ownBuff.combat.dmg_.electric.add(corrodeBoneDmg),
  undefined, undefined, false
)
```

Without it, the formula value is selectable as an opt target but won't render in the character sheet.

**Use `customAnomalyDmg` for Abloom formula-based damage** (like Aria's Perfect Pitch Abloom):

```ts
// In data file:
...customAnomalyDmg('perfectPitchAbloomDmgInst', {
  attribute: data_gen.attribute,
  damageType1: 'anomaly',
  damageType2: 'abloom',
},
  prod(
    percent(subscript(char.core, dm.core.abloomEther)),
    percent(0.1),
    own.initial.anomMas,
    constant(0.625),
    own.final.atk,
    sum(percent(1), own.final.anom_mv_mult_)
  )
)
```

Tag always includes `damageType2: 'abloom'`. Available anomaly formula types: `customAnomalyDmg` (damage), `customAnomalyBuildup` (anomaly buildup).

**Always-on mindscape stats don't need bool conditionals.** If an M effect is a passive stat that is always active when the mindscape is unlocked (not a toggleable state), use `cmpGE` directly:

```ts
// ✅ Always-on M stat — no bool conditional needed:
registerBuff('m1_abloom',
  ownBuff.combat.anom_crit_.add(
    cmpGE(char.mindscape, 1, sum(
      constant(dm.m1.abloomCrit),
      max(0, prod(max(0, sum(own.initial.anomMas, -dm.m1.anomMasteryThreshold)), percent(dm.m1.critPerExcessMastery)))
    ))
  ),
  undefined, undefined, false
);
```

Only use bool conditionals for effects that need a user toggle (delusion state, stance, buff active, etc.).

**Use `anom_crit_`/`anom_crit_dmg_` for Abloom CRIT stats.** Abloom reads anomaly crit tags (`anom_crit_`, `anom_crit_dmg_`) from the anomaly pipeline, not regular `crit_`/`crit_dmg_`. Register Abloom CRIT buffs against these tags:

```ts
ownBuff.combat.anom_crit_.add(...)      // Abloom CRIT rate
ownBuff.combat.anom_crit_dmg_.add(...)  // Abloom CRIT damage
```

**Use `includeOriginalEntry: false` for override buffs** that replace original entries to avoid double-counting. Pass as 5th param to `registerBuff`:

```ts
const m6_perfectPitch_dmg_ = ownBuff.combat.dmg_.ether.add(
  cmpGE(char.mindscape, 6, m6Delusion.ifOn(percent(dm.m6.enhancedDmg)))
)
// Applied via dmgDazeAndAnomOverride extras — no double-count
registerBuff('m6_perfectPitch_dmg_', m6_perfectPitch_dmg_, undefined, undefined, false)
```

The 5th param `false` means `includeOriginalEntry: false` (the override buff replaces rather than adds to the original).

**Split flat Ability+M1 values** into separate conditional-gated buffs:

```ts
// Ability (always-on basic part):
registerBuff('ability_presumptionDefIgn',
  teamBuff.combat.defIgn_.addWithDmgType('abloom',
    ability_check_no_self(presumptionOfGuilt.ifOn(0.4))
  ), undefined, true
);

// M1 (separate, conditional-gated):
registerBuff('m1_defIgn_',
  teamBuff.combat.defIgn_.addWithDmgType('abloom',
    cmpGE(char.mindscape, 1,
      ability_check_no_self(presumptionOfGuilt.ifOn(percent(dm.m1.additionalDefIgnore)))
    )
  ), undefined, true
);
```

**Wrap existing buffs in venom/state conditionals** to make them toggleable by the user:

```ts
// Cissia pattern — ability buffs gated behind a "Venom State" toggle:
const venomActive = (node: any) =>
  cmpGE(sum(venomDefIgn.ifOn(1), venomCritDmg.ifOn(1)), 1, node);

registerBuff('ability_squad_crit_dmg_',
  teamBuff.combat.crit_dmg_.add(
    venomActive(cmpGE(sum(team.common.count.withSpecialty('stun'), team.common.count.electric), 2, percent(dm.ability.squadCritDmg_)))
  ), undefined, true
);

registerBuff('core_defIgn_',
  ownBuff.combat.defIgn_.electric.add(venomActive(prod(coreDefIgnore, m1_defIgnoreMult))),
  undefined, true
);
```

**Use per-skill granular buff names** instead of generic element/type names. When a mindscape or ability gives the same buff to multiple skills, create separate named buffs per skill so the UI can display them distinctly (OrphieMagus pattern):

```ts
// ❌ BEFORE — generic:
const m1_fire_resIgn_ = ownBuff.combat.resIgn_.fire.add(cmpGE(char.mindscape, 1, percent(dm.m1.fire_resIgn_)));
registerBuff('m1_fire_resIgn_', m1_fire_resIgn_, undefined, false, false);

// ✅ AFTER — per-skill granular:
const m1_resIgnValue = cmpGE(char.mindscape, 1, percent(dm.m1.fire_resIgn_));
const m1_corrosiveFlash_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue);
const m1_crimsonVortex_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue);
const m1_heatCharge_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue);
const m1_fieryEruption_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue);

registerBuff('m1_corrosiveFlash_resIgn_', m1_corrosiveFlash_resIgn_, undefined, false, false);
registerBuff('m1_crimsonVortex_resIgn_', m1_crimsonVortex_resIgn_, undefined, false, false);
registerBuff('m1_heatCharge_resIgn_', m1_heatCharge_resIgn_, undefined, false, false);
registerBuff('m1_fieryEruption_resIgn_', m1_fieryEruption_resIgn_, undefined, false, false);
```

Then apply the specific buff as an extra in the corresponding `dmgDazeAndAnomOverride`:

```ts
dmgDazeAndAnomOverride(
  dm, 'special', 'EXSpecialAttackHeatCharge', 0,
  { ...baseTag, damageType1: 'exSpecial', damageType2: 'aftershock' }, 'atk',
  undefined,
  m1_heatCharge_resIgn_,
  m4_heatCharge_dmg_
)
```

This gives the sheet UI the ability to show which skill gets which buff, and each field can be rendered with its own `ColorText` variant. Use the same pattern for M4/M6 generic damage bonuses that apply to multiple skills.

### A3. Meta (`buffs.ts`, `conditionals.ts`, `formulas.ts`)

These are auto-generated. Run `bun nx run-many -t gen-file` after data changes.

Key manual corrections in `buffs.ts`:
- Set `team: true` for team-wide buffs that were previously `team: false`
- Set `team: false` for self-only buffs that were previously `team: true`

### A4. UI Sheet (`<Char>.tsx`)

**Replace hardcoded string titles** with locale-driven `<ColorText>`:

```tsx
// ❌ BEFORE:
{ title: 'Corrode Bone Electric DMG', fieldRef: buff.core_corrodeBone_dmg_.tag }

// ✅ AFTER:
{
  title: <ColorText color={getVariant(buff.core_corrodeBone_dmg_.tag)}>{ch('core_corrodeBone_dmg_')}</ColorText>,
  fieldRef: buff.core_corrodeBone_dmg_.tag,
}
```

**Single-field docs → header + `fieldForBuff`:**

```tsx
// ❌ BEFORE:
{
  type: 'fields',
  fields: [{ title: 'CP CR to CD conversion', fieldRef: buff.core_critDmg_.tag }],
}

// ✅ AFTER:
{
  type: 'fields',
  header: { icon: null, text: ch('core_critDmg_') },
  fields: [fieldForBuff(buff.core_critDmg_)],
}
```

**Multi-field docs get group headers:**

```tsx
{
  type: 'fields',
  header: { icon: null, text: 'DMG' },  // or ch('xxx_header')
  fields: [
    fieldForBuff(buff.ability_wind_dmg_),
    fieldForBuff(buff.ability_vortex_dmg_),
  ],
}
```

**Per-skill granular fields** (from OrphieMagus) use individual field objects with `ColorText`:

```tsx
{
  type: 'fields',
  header: { icon: null, text: ch('m1_header') },
  fields: [
    {
      title: <ColorText color={getVariant(buff.m1_corrosiveFlash_resIgn_.tag)}>{ch('m1_corrosiveFlash_resIgn_')}</ColorText>,
      fieldRef: buff.m1_corrosiveFlash_resIgn_.tag,
    },
    {
      title: <ColorText color={getVariant(buff.m1_crimsonVortex_resIgn_.tag)}>{ch('m1_crimsonVortex_resIgn_')}</ColorText>,
      fieldRef: buff.m1_crimsonVortex_resIgn_.tag,
    },
  ],
}
```

**Conditional labels → `ch('keyCond')`:**

```tsx
// ❌ BEFORE:
conditional: { label: 'Ether Veil: Cold-Blooded', metadata: cond.etherVeil, ... }

// ✅ AFTER:
conditional: {
  label: ch('etherVeilCond'),
  description: (<SkillGameDesc characterKey={key} ns="char_Cissia_gen" key18="chain.UltimateOphidiophobia.desc" />),
  metadata: cond.etherVeil,
  fields: [fieldForBuff(buff.core_etherVeil_crit_dmg_)],
}
```

**Skill-specific conditionals go inside `perSkillAbility`.** For conditionals tied to a specific skill (chain attack, ultimate, EX special), place the `conditional` doc inside the skill's array under `perSkillAbility`:

```tsx
const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      Ultimate100Energy: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Aria_gen"
                key18="chain.Ultimate100Energy.desc"
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.ultimate_atk)],
          },
        },
      ],
    },
  },
  core: [...],
  m1: [...],
  m2: [...],
  m6: [...],
})
```

**Replace hardcoded descriptions:**

```tsx
// Core passive paragraph:
description: <CoreGameDesc characterKey={key} paragraph={2} />,

// Any skill ability:
description: <SkillGameDesc characterKey={key} ns="char_<Key>_gen" key18="basic.CorrodeBone.desc" />,

// Mindscape:
description: <GameDesc ns="char_<Key>_gen" key18="mindscapes.1.desc" />,

// Ability with multiple description paragraphs:
description: (<>
  <GameDesc ns="char_Cissia_gen" key18="ability.desc.0" />
  <div style={{ marginBottom: 8 }} />
  <GameDesc ns="char_Cissia_gen" key18="ability.desc.1" />
</>),
```

**Add `linked` for paired conditionals** (two toggles that affect each other):

```tsx
conditional: {
  label: ch('venomDefIgnCond'),
  ...
  linked: 'venomCritDmg',
}
```

For **3+ linked conditionals**, use an array — each toggle in the group stays in sync with the others. OrphieMagus uses this for 3-way linked conditionals across core, ability, and M1:

```tsx
conditional: {
  label: ch('overwhelminglyPositiveCommonCond'),
  ...
  linked: ['overwhelmingly_positive_resIgn', 'overwhelmingly_positive_atk'],
}
```

Multiple documents in different sheet sections can link to each other:

```tsx
// core section — zeroedIn linked to ability and m1
{ ... label: ch('coreCond'), metadata: cond.zeroedIn, linked: ['zeroedIn_ability', 'zeroedIn_m1_dmg'] }

// ability section — zeroedIn_ability linked back to core and m1
{ ... label: ch('abilityCond'), metadata: cond.zeroedIn_ability, linked: ['zeroedIn', 'zeroedIn_m1_dmg'] }

// m1 section — zeroedIn_m1_dmg linked back to core and ability
{ ... label: ch('m1Cond'), metadata: cond.zeroedIn_m1_dmg, linked: ['zeroedIn', 'zeroedIn_ability'] }
```

**Import map** — always add these when converting:

```tsx
import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import { GameDesc } from '../../../i18n'
import { CoreGameDesc, createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'
```

### A5. Localization (`char_<Char>.json`)

**Conditional keys** end with `Cond`. Format: `"<trigger/state> · <effect>"`:

```json
{
  "etherVeilCond": "Ether Veil: Cold-Blooded · CRIT DMG",
  "dazeSquadBuffCond": "Adorable Explosive Impact Hit · Daze & DMG",
  "m1ResIgnCond": "Adorable Explosive Impact Hit · RES Red",
  "m1VortexCond": "Vortex Hit · RES Ignore",
  "m4Cond": "EX Special Hit · ATK"
}
```

**Header keys** end with `_header`:

```json
{
  "core_header": "HP to SF",
  "ability_header": "Daze",
  "m2_header": "DMG",
  "m6_header": "CR & DMG"
}
```

**Field title keys** use the buff name directly:

```json
{
  "core_corrodeBone_dmg_": "Corrode Bone Additional DMG",
  "core_critDmg_": "CR to CD",
  "core_atk": "SF to ATK",
  "m6_daze_": "Armor-Piercing Warhead Daze"
}
```

**Per-skill granular fields** follow the same convention — use the buff name as the key, describe which skill it applies to:

```json
{
  "m1_corrosiveFlash_resIgn_": "Corrosive Flash RES Ignore",
  "m1_crimsonVortex_resIgn_": "Crimson Vortex RES Ignore",
  "m1_heatCharge_resIgn_": "Heat Charge RES Ignore",
  "m1_fieryEruption_resIgn_": "Fiery Eruption RES Ignore",
  "m4_heatCharge_dmg_": "Heat Charge DMG",
  "m4_ultimate_dmg_": "Dance With Fire DMG"
}
```

**Short abbreviations** for compact sections:

```json
{
  "core_anomProf": "AP",
  "core_impact": "AM to Impact",
  "m4_anomProf": "AP",
  "ability_crit_dmg_": "CD",
  "m1_crit_": "CR"
}
```

---

## Part B: W-Engines

### B1. Formula Data

**Use `.addOnce(key, ...)` for non-stacking team buffs** to prevent stacking from multiple copies:

```ts
// ❌ BEFORE:
teamBuff.combat.common_dmg_.add(cmpSpecialtyAndEquipped(key, ...))

// ✅ AFTER:
teamBuff.combat.common_dmg_.addOnce(key, cmpSpecialtyAndEquipped(key, ...))
```

Exact signature: `teamBuff.combat.<stat>.addOnce(wengineKey, <value>)`.

### B2. Formula Data — wengine buff registration flags

Apply `showSpecialtyAndEquipped(key)` for passives that check specialty/equipped:

```ts
registerBuff('passive_atk_',
  teamBuff.combat.atk_.addOnce(key, cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.atk_)))),
  showSpecialtyAndEquipped(key),  // reader condition for UI
  true  // team
);
```

### B3. UI Sheet (`<WEngine>.tsx`)

**Replace `{ title: '...', fieldRef: ... }` with `tagToTagField`:**

```tsx
// ❌ BEFORE:
{ title: 'Impact buff', fieldRef: buff.impact.tag }

// ✅ AFTER:
tagToTagField(buff.impact.tag)
```

**Add headers to fields sections:**

```tsx
{
  type: 'fields',
  header: { icon: null, text: ch('passive_header') },
  fields: [
    tagToTagField(buff.impact.tag),
    tagToTagField(buff.fireResIgn_.tag),
  ],
}
```

**Rename conditionals** from generic `cond` to descriptive:

```tsx
// ❌ BEFORE:
label: ch('cond'),

// ✅ AFTER:
label: ch('offFieldCond'),
label: ch('exFireStacksCond'),
label: ch('eclipseActiveCond'),
label: ch('energyConsumedCond'),
label: ch('stacksCond'),
```

**Group related buff fields** from separate `fields` docs into a single doc with header:

```tsx
// ❌ BEFORE:
{ type: 'fields', fields: [tagToTagField(buff.passive_enerRegen.tag)] },
{ type: 'fields', fields: [tagToTagField(buff.passive_atk_.tag), tagToTagField(buff.passive_hp_.tag)] },

// ✅ AFTER:
{ type: 'fields', header: { icon: null, text: ch('passive_enerRegen') }, fields: [tagToTagField(buff.passive_enerRegen.tag)] },
{ type: 'fields', header: { icon: null, text: ch('passive_squad_header') }, fields: [tagToTagField(buff.passive_atk_.tag), tagToTagField(buff.passive_hp_.tag)] },
```

### B4. Localization (`wengine_<WEngine>.json`)

**Conditional keys** — rename from `cond` to descriptive `xxxCond`:

```json
{
  "offFieldCond": "Off-Field · ER",
  "exFireStacksCond": "EX Special Fire Hit · DMG",
  "enemyWithAnomalyCond": "Enemy with Anomaly · DMG",
  "specialUsedCond": "Special / EX Special Used · DMG",
  "stacksCond": "EX Special / Basic Ether Hit · DMG & AP"
}
```

**Header keys** — add for grouped sections:

```json
{
  "passive_header": "Impact & RES Ign",
  "passive_enerRegen": "ER",
  "passive_squad_header": "ATK & HP",
  "critRate_": "CR",
  "crit_": "CR",
  "anomProf": "AP"
}
```

**Field title keys** — for explicit field names (cannot auto-gen):

```json
{
  "passive_crit_": "CR"
}
```

---

## Part C: Display Components (Self-Contained)

### C1. CharacterConditionalsDisplay

The `CharacterConditionalsDisplay` component is **self-contained** — it no longer requires `conditionalFields`, `conditionalDescriptions`, `conditionalLabels`, or `passiveFields` as props. It extracts all of these internally from `charSheets` and `buffs`:

```tsx
// ✅ Current API (OptimizerForm.tsx):
<CharacterConditionalsDisplay
  characterKey={characterKey}
  showPassives={showCharPassives}
/>

// ✅ Teammate view (TeammateCard.tsx):
<CharacterConditionalsDisplay
  characterKey={characterKey}
  mindscapeOverride={effectiveMindscape}
  teammateKey={characterKey}
  showZeroFields={true}
  showPassives={showCharPassives}
/>
```

Key props:
- `characterKey` — the character to display conditionals for
- `mindscapeOverride` — override mindscape level (used in teammate card)
- `teammateKey` — when set, filters to only team-wide buffs (used in teammate view)
- `showZeroFields` — whether to show fields with zero value
- `showPassives` — whether to show always-active passive field groups

The component groups conditionals and passives by section (Basic Attack, Dodge, Assist, Special, Chain Attack, Core, Additional Ability, Potential, M1–M6) using a `SECTION_ORDER` array. Each section can show:
- **Passive fields** — always-active stat buffs (shown inside `HoverCard` dropdowns)
- **Conditionals** — interactive toggles/switches/sliders that the user can set

Linked conditionals are tracked and synchronized — when one toggle changes, all linked toggles change with it.

### C2. WEngineConditionalsDisplay

Similarly self-contained. Extracts conditional fields and passive field groups from `wengineUiSheets`:

```tsx
// ✅ Current API (OptimizerForm.tsx):
<WEngineConditionalsDisplay
  wengineKey={wengineKey}
  showPassives={showWenginePassives}
/>

// ✅ Teammate view (TeammateCard.tsx):
<WEngineConditionalsDisplay
  wengineKey={wengineKey}
  teammateKey={characterKey}
  wenginePhase={effectivePhase}
  showPassives={showWenginePassives}
/>
```

For w-engines with complex phase descriptions split across multiple parts (e.g., CRIT Rate vs conditional buff), the component provides per-wengine description helper functions. These are defined internally in `WEngineConditionalsDisplay.tsx` and are only needed when a w-engine's phase description needs to be shown differently for different buff sections.

---

## Part D: Step-by-Step Checklist

For each character or w-engine, follow these steps in order:

### Characters

- [ ] **1. Formula data** — delete `anomBuildup_` buffs; delete unused `customDmg` entries; delete unused conditionals; add conditional wrappers for M-gated effects; use `teamBuff` for team buffs; use `dmgDazeAndAnomOverride` for per-skill extra daze; split flat Ability+M1 values into separate buffs; use per-skill granular buff names for multi-skill M effects; set `includeOriginalEntry: false` (5th param) on override buffs that replace original entries.
- [ ] **2. Run `bun nx run-many -t gen-file`** to regenerate meta files (`buffs.ts`, `conditionals.ts`, `formulas.ts`).
- [ ] **3. Fix `team: true/false` in `buffs.ts`** — set `team: true` for `teamBuff` entries, `team: false` for self-only buffs.
- [ ] **4. UI sheet** — remove deleted buff references; add headers; replace hardcoded strings with `ch('key')`; use `fieldForBuff`; use `CoreGameDesc`/`SkillGameDesc`/`GameDesc` for descriptions; add `getVariant` + `ColorText` for element-typed fields; add `linked` arrays for grouped conditionals.
- [ ] **5. Localization** — add `Cond`, `_header`, and field title keys following conventions.
- [ ] **6. Format** — `bun biome check --write --formatter-enabled=true --linter-enabled=false --assist-enabled=true`
- [ ] **7. Typecheck** — `npx nx run-many --target=typecheck`
- [ ] **8. Lint** — `npx nx run-many --target=eslint:lint --max-warnings=0`
- [ ] **9. Test** — `npx nx run-many --target=test`

### W-Engines

- [ ] **1. Formula data** — change `add()` to `addOnce(key, ...)` for team non-stacking buffs; ensure `showSpecialtyAndEquipped` is applied.
- [ ] **2. Run `bun nx run-many -t gen-file`** to regenerate meta files.
- [ ] **3. UI sheet** — replace `{title, fieldRef}` with `tagToTagField`; add headers; rename `cond` to descriptive names.
- [ ] **4. Localization** — update conditional keys; add header/field keys.
- [ ] **5-8.** Same format → typecheck → lint → test flow.

---

## Part E: Common Pitfalls

- **Forgotten `anomBuildup_` in `allAnomBuffs` arrays** — check `dmgDazeAndAnomOverride` extra spreads.
- **`team: true/false` mismatch** — `registerBuff` 4th param must match `buffs.ts` meta.
- **Import missing `getVariant` / `ColorText`** — always add them to the import block.
- **Locale key naming inconsistency** — suffix `Cond` for conditionals, `_header` for headers, bare name for field titles.
- **`Icon: null` vs `<></>`** — use `icon: null` for header without icon, `<ImgIcon ... />` for section icons.
- **`customDmg` formula not rendering in sheet** — `customDmg` only registers a formula entry. Without a matching `registerBuff('same_name', ...)`, the field is filtered out by the display logic because it checks `buffs[name]`. Add both `customDmg` (for the formula) and `registerBuff` (for the sheet display).
- **`includeOriginalEntry: false` forgotten on override buffs** — when a buff is applied via `dmgDazeAndAnomOverride` extras, the standalone `registerBuff` must set 5th param to `false` to prevent double-counting.
- **`anom_crit_` vs `crit_` for Abloom** — Abloom CRIT uses `anom_crit_`/`anom_crit_dmg_` tags (anomaly pipeline), not regular `crit_`/`crit_dmg_`. Using wrong tag means the CRIT stat has no effect.
- **Generated files out of sync** — always run `gen-file` after data changes and before testing.
- **Orphan conditionals in meta files** — if you add granular per-skill buffs, the `conditionals.ts` meta file may generate extra conditional entries for unused bool conditionals. Remove any that are not used by any character sheet.
- **Linked conditionals across sections** — when linking conditionals across core/ability/M1 sections, ensure all linked names exist in the same `allBoolConditionals` call and that each conditional's `linked` array references the others symmetrically.
