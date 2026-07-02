# Character & W-Engine Implementation Guide

Based on patterns observed in commit `30fbf74` (Norma character + ChiefSidekick W-Engine).

---

## Character Implementation

### Files to create/modify

| # | File | Action |
|---|------|--------|
| 1 | `app/src/formula/data/char/sheets/{Name}.ts` | **Create** — Formula data sheet (core logic) |
| 2 | `app/src/formula-ui/char/sheets/{Name}.tsx` | **Create** — UI sheet (display fields & conditionals) |
| 3 | `app/src/formula/meta/char/{Name}/buffs.ts` | **Generate** — Buff metadata (auto-generated / manual) |
| 4 | `app/src/formula/meta/char/{Name}/conditionals.ts` | **Generate** — Conditional metadata |
| 5 | `app/src/formula/meta/char/{Name}/formulas.ts` | **Generate** — Formula metadata (for `customDmg` entries) |
| 6 | `app/src/localization/assets/locales/en/char_{Name}.json` | **Create** — English locale strings |

---

### 1. Formula data sheet (`app/src/formula/data/char/sheets/{Name}.ts`)

**Imports:**

```typescript
import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE, max, min, prod, subscript, sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customDmg,
  enemyDebuff,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
  teamBuff,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'
```

**Boilerplate:**

```typescript
const key: CharacterKey = '{Name}'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own
```

**Conditionals (using `allBoolConditionals`):**

Third argument maps conditional name to mindscape requirement (optional).

```typescript
const { condName1, condName2 } = allBoolConditionals(
  key,
  undefined,
  {
    condName2: 1,   // unlocked at M1
    condName3: 6,   // unlocked at M6
  }
)
```

- No third arg → no mindscape requirement, always available.
- Key with value `N` → conditional only shows when `mindscape >= N`.

**Ability activation check (optional):**

Check teammate specialties/factions; threshold `>= 2` means "self + at least 1 teammate":

```typescript
const abilityOn = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('attack'),
      team.common.count.withSpecialty('rupture'),
      team.common.count.withFaction('SomeFactionName')
    ),
    2,
    node
  )
```

**Core Passive formulas (always active):**

```typescript
const coreCritDmg_ = ownBuff.combat.crit_dmg_.add(
  min(
    percent(subscript(char.core, dm.core.maxCritDmg_)),
    prod(
      max(0, sum(own.common.cappedCrit_, -dm.core.critRateThreshold)),
      percent(1 / dm.core.critRateStep),
      percent(subscript(char.core, dm.core.critDmgPerStep))
    )
  )
)
```

Use `ownBuff.combat.{stat}.addWithDmgType('exSpecial', value)` for damage-type-scoped daze buffs.

**Mindscape formulas (conditionally active):**

```typescript
const m6_dazeBuff = ownBuff.combat.dazeInc_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.daze_))
)
```

**⚠️ Watch out: `percent()` vs raw decimals**

Some combat stats expect raw decimal values, NOT `percent()`-wrapped values:

| Stat | Expected | Wrong pattern | Bug |
|---|---|---|---|
| `defIgn_` | `0.4` (for 40%) | `percent(40)` | Shows "4000%" — 2 extra zeros |
| `anom_mv_mult_` | `1.2` (for 120%) | `percent(120)` | Shows "12000%" — 2 extra zeros |
| `resIgn_` | `0.15` (for 15%) | `percent(15)` | Shows "1500%" — 2 extra zeros |

> **Rule:** `percent(N)` produces the integer `N` (so `percent(40)` = 40 = 4000%). For coefficient stats like `defIgn_`, `resIgn_`, and `anom_mv_mult_`, use raw decimals (e.g. `0.4` = 40%, `1.2` = 120%). Check Vivian's implementation for reference — her M2 uses raw `dm.m2.abloom_bonus` (a decimal value) without a `percent()` wrapper.

**Inline formula-scoped buffs (bake into formula, not global buff)**

When a mindscape buff should affect **only one specific hit/attack** (not all damage of a given type), add it directly into that formula rather than as a global buff:

```typescript
// ❌ Global buff — affects ALL abloom damage
registerBuff(
  'm2_abloomMvMult',
  ownBuff.combat.anom_mv_mult_.addWithDmgType('abloom', ...)
)

// ✅ Inline — only affects the specific formula
prod(
  percent(subscript(own.char.core, dm.core.trialConsumeToTrigger)),
  own.final.atk,
  sum(
    percent(1),
    own.final.anom_mv_mult_,
    cmpGE(char.mindscape, 2, 1.2)  // +120% scoped to this formula only
  )
)
```

> **Rule:** Use `ownBuff.combat.{stat}.addWithDmgType(...)` when the buff applies globally to all damage of that type. Use inline `cmpGE(char.mindscape, N, value)` inside a specific formula's `sum()` when the bonus should only apply to that one hit.

**Multiple damage types for the same buff value**

If a buff applies to multiple damage types (e.g., both `'anomaly'` and `'disorder'`), use separate `registerBuff` calls with different `addWithDmgType` targets:

```typescript
const m6_resIgn = cmpGE(char.mindscape, 6, 0.15)  // 15% RES ignore

registerBuff('m6_resIgn_anomaly', ownBuff.combat.resIgn_.addWithDmgType('anomaly', m6_resIgn))
registerBuff('m6_resIgn_disorder', ownBuff.combat.resIgn_.addWithDmgType('disorder', m6_resIgn))
```

> **Note:** `'disorder'` IS a valid damage type in the system — it's used across every character's `disorderDmgInst_*` formula. Don't assume it doesn't exist.

**Team-wide buffs (`teamBuff`)**

When a buff description says **"any squad member"** or affects the whole team, use `teamBuff` instead of `ownBuff`, and pass `undefined, true` to `registerBuff`:

```typescript
registerBuff(
  'ability_presumptionDefIgn',
  teamBuff.combat.defIgn_.addWithDmgType(
    'abloom',
    abilityOn(presumptionOfGuilt.ifOn(0.4))
  ),
  undefined,
  true  // team buff
)
```

The `team: true` flag must also be set in the `buffs.ts` metadata.

---

**Main `register()` call — arguments in order:**

```typescript
const sheet = register(
  key,

  // 1. Base entries
  entriesForChar(data_gen),

  // 2. All damage/daze/anomaly formulas (with optional per-hit overrides)
  ...registerAllDmgDazeAndAnom(key, dm, /* optional overrides... */),

  // 3. Custom damage formulas (e.g. M6 bonus attack)
  ...customDmg(
    'custom_name',
    { ...baseTag, damageType1: 'ult' },
    cmpGE(char.mindscape, 6, condName.ifOn(prod(own.final.atk, percent(dm.m6.someDmg))))
  ),

  // 4. Core Passive buffs
  registerBuff('core_critDmg_', coreCritDmg_, undefined, undefined, false),   // last arg false = not team buff
  registerBuff('core_exSpecial_dazeInc_', ownBuff.combat.dazeInc_.addWithDmgType('exSpecial', coreDazeInc)),
  registerBuff('core_atk', coreAtk, undefined, undefined, false),

  // 5. Additional Ability buffs
  registerBuff(
    'ability_atk',
    ownBuff.combat.atk.add(
      abilityOn(
        condName.ifOn(
          min(dm.ability.maxAtk, sum(dm.ability.atkBase, prod(char.lvl, dm.ability.atkPerLevel)))
        )
      )
    )
  ),
  registerBuff(
    'ability_squadDmg_',
    teamBuff.combat.common_dmg_.add(abilityOn(condName.ifOn(dm.ability.squadDmg_))),
    undefined,
    true  // team buff
  ),

  // 6. Mindscape buffs
  registerBuff(
    'm1_allResRed_',
    enemyDebuff.common.resRed_.add(cmpGE(char.mindscape, 1, condName.ifOn(dm.m1.allResRed_)))
  ),
  registerBuff('m6_daze_', m6_dazeBuff, undefined, undefined, false),
)

export default sheet
```

**`registerBuff` signature:**

```typescript
registerBuff(name: string, tagNode: TagMapNodeEntry, ...rest: any[])
// 3rd arg: show condition (undefined = always)
// 4th arg: boolean — isTeamBuff? (true/false)
// 5th arg: boolean — hideInDisplay? (last arg false = show in UI)
```

**`registerAllDmgDazeAndAnom` overrides (OPTIONAL — only for per-hit M6 buffs):**

```typescript
dmgDazeAndAnomOverride(
  dm,
  'special',                    // skill type
  'EXSpecialAttackName',        // exact skill name from dm
  hitIndex,                     // which hit (0-indexed)
  { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
  'atk',                        // scaling stat
  undefined,                    // extra tag entries (or undefined)
  extraBuffNode                 // extra buff to apply to this hit
)
```

Only needed when a mindscape buff needs to apply to specific hits within a skill.

---

### 2. UI sheet (`app/src/formula-ui/char/sheets/{Name}.tsx`)

**Imports:**

```typescript
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Name } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
```

**Boilerplate:**

```typescript
const key: CharacterKey = '{Name}'
const [, ch] = trans('char', key)
const cond = Norma.conditionals
const buff = Norma.buffs
```

**Sheet structure:**

```typescript
const sheet = createBaseSheet(key, {
  core: [
    // Each entry is a section group
    {
      type: 'fields',
      fields: [
        {
          title: 'CP CR to CD conversion',
          fieldRef: buff.core_critDmg_.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: 'CP Daze buff',
      },
      fields: [
        fieldForBuff(buff.core_exSpecial_dazeInc_),
        fieldForBuff(buff.core_special_dazeInc_),
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_{Name}_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_{Name}_gen" key18="ability.desc.3" />
          </>
        ),
        metadata: cond.enNahBarrage,  // ties to the bool conditional
        fields: [
          fieldForBuff(buff.ability_atk),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_{Name}_gen" key18="mindscapes.1.desc" />,
        metadata: cond.conditionalName,  // bool conditional
        fields: [fieldForBuff(buff.m1_allResRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: 'M6 Daze and DMG buff',
      },
      fields: [
        {
          title: 'Armor-Piercing Warhead Daze',
          fieldRef: buff.m6_daze_.tag,
        },
      ],
    },
  ],
})

export default sheet
```

**Section keys:** `core`, `ability`, `m1`, `m2`, `m3`, `m4`, `m5`, `m6`

**Group types:**
- `type: 'fields'` — Static display of buff values (no toggle)
- `type: 'conditional'` — Toggleable conditional with `metadata` linking to a conditional

**Display helpers:**
- `fieldForBuff(buffRef)` — Auto-generates a field display from a buff, including the auto-generated 
title (e.g. "Anomaly Proficiency", "DEF Ignore") from the buff tag
- `{ title, fieldRef }` — Manual field with custom title
- `{ fieldValue: dm.m2.someStat, unit: '%' }` — Static value display (no tag dependency). Use for flat mindscape values that don't depend on a conditional toggle.
- `fieldForBuff(buffRef).title` — Extract just the auto-generated title element from a buff (useful when you need the auto-title alongside a custom second field in the same section)

**Icons:**
- Core Passive: `commonDefIcon('coreFlat')` / `commonDefIcon('core')`
- Mindscape N: `mindscapeDefIcon(N)` (N = 1-6)

**Description helpers:**
- `<GameDesc ns="char_{Name}_gen" key18="ability.desc.0" />` for generated locale keys
- `<GameDesc ns="char_{Name}_gen" key18="mindscapes.1.desc" />` for mindscape descriptions
- Combine multiple locale paragraphs in descriptions using a `<>...</>` fragment:

```tsx
<>
  <GameDesc ns="char_{Name}_gen" key18="ability.desc.0" />
  <div style={{ marginBottom: 8 }} />
  <GameDesc ns="char_{Name}_gen" key18="ability.desc.3" />
</>
```

---

### 3. Generated metadata files

These files are marked `// WARNING: Generated file, do not modify`. They reflect the exact buff/conditional/formula names used in the data sheet.

**`app/src/formula/meta/char/{Name}/buffs.ts`** — One entry per `registerBuff` call:

```typescript
export const buffs = {
  core_critDmg_: {
    sheet: '{Name}',
    name: 'core_critDmg_',
    tag: {
      et: 'display',
      qt: 'combat',
      q: 'crit_dmg_',              // stat quantifier
      sheet: '{Name}',
      damageType1: 'exSpecial',    // if scoped to dmg type
      name: 'core_critDmg_',
    },
    team: false,
  },
  ability_squadDmg_: {
    ...
    team: true,                    // team buffs set to true
  },
}
```

**`app/src/formula/meta/char/{Name}/conditionals.ts`** — One entry per conditional:

```typescript
export const conditionals = {
  condName: { sheet: '{Name}', name: 'condName', type: 'bool' },
  m6Cond: {
    sheet: '{Name}',
    name: 'm6Cond',
    type: 'bool',
    mindscapeRequirement: 6,    // only if mindscape-gated
  },
}
```

**`app/src/formula/meta/char/{Name}/formulas.ts`** — Only entries for `customDmg` calls:

```typescript
export const formulas = {
  custom_name: {
    sheet: '{Name}',
    name: 'custom_name',
    tag: {
      et: 'own',
      qt: 'formula',
      q: 'standardDmg',
      sheet: '{Name}',
      attribute: 'fire',
      damageType1: 'ult',
      name: 'custom_name',
    },
  },
}
```

---

### 4. Locale file (`app/src/localization/assets/locales/en/char_{Name}.json`)

```json
{
  "abilityCond": "AA Some state",
  "m1Cond": "M1 RES shred",
  "m6Cond": "M6 Bombardment state"
}
```

- Keys match the `ch('key')` references in the UI sheet
- Convention: `abilityCond`, `m1Cond`, `m2Cond`, ..., `m6Cond`

---

## W-Engine Implementation

### Files to create/modify

| # | File | Action |
|---|------|--------|
| 1 | `app/src/formula/data/wengine/sheets/{Name}.ts` | **Create** — Formula data sheet |
| 2 | `app/src/formula-ui/wengine/sheets/{Name}.tsx` | **Create** — UI sheet |
| 3 | `app/src/formula/meta/wengine/{Name}/conditionals.ts` | **Generate** — Conditional metadata |
| 4 | `app/src/localization/assets/locales/en/wengine_{Name}.json` | **Create** — English locale strings |
| 5 | `app/src/page-optimize/Optimize/WEngineConditionalsDisplay.tsx` | **Modify** — Custom desc components (if needed) |

---

### 1. Formula data sheet (`app/src/formula/data/wengine/sheets/{Name}.ts`)

**Imports:**

```typescript
import { cmpEq, cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'
```

**Boilerplate + Conditionals:**

```typescript
const key: WengineKey = '{Name}'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

// Bool conditional (on/off toggle)
const { offField } = allBoolConditionals(key)

// Num conditional (0..max, integer)
const { stackName } = allNumConditionals(key, true, 0, dm.maxStacks)
```

**`registerWengine` call:**

```typescript
const sheet = registerWengine(
  key,

  // IMPORTANT: Always include entriesForWengine as the first arg after key
  entriesForWengine(key),

  // 1. Base stat buffs (non-combat — use ownBuff.base.*)
  registerBuff(
    'impact',
    ownBuff.base.impact.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.impact))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 2. Always-on combat stat buffs (use ownBuff.combat.*)
  registerBuff(
    'fireResIgn_',
    ownBuff.combat.resIgn_.fire.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.fireResIgn_))
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 3. Damage-type-scoped buffs with .map() pattern for dmg_. sub-properties
  registerBuff(
    'vortexDmg_',
    ownBuff.combat.dmg_.vortex.map((r) =>
      r.add(
        cmpSpecialtyAndEquipped(
          key,
          prod(wind_ex_stacks, subscript(phase, dm.vortexDmg_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'windsweptDmg_',
    ownBuff.combat.dmg_.windswept.map((r) =>
      r.add(
        cmpSpecialtyAndEquipped(
          key,
          prod(wind_ex_stacks, subscript(phase, dm.vortexDmg_))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 4. Attribute-specific DMG buffs (use .attribute sub-property)
  registerBuff(
    'cond_ice_dmg_',
    ownBuff.combat.common_dmg_.ice.add(
      cmpSpecialtyAndEquipped(
        key,
        cmpEq(
          own.char.attribute,
          'ice',
          prod(specialUsed, percent(subscript(phase, dm.ice_dmg_)))
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 5. Damage-type-scoped buffs with addWithDmgType() for non-attribute scopes
  registerBuff(
    'cond_abloom_dmg_',
    ownBuff.combat.common_dmg_.addWithDmgType(
      'abloom',
      cmpSpecialtyAndEquipped(
        key,
        cmpEq(
          own.char.attribute,
          'ice',
          cmpGE(
            specialUsed,
            dm.stack_threshold,
            percent(subscript(phase, dm.abloom_dmg_))
          )
        )
      )
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 6. Team-wide buffs (pass true as last arg to registerBuff)
  registerBuff(
    'squadAnomProf',
    teamBuff.combat.anomProf.add(
      cmpSpecialtyAndEquipped(
        key,
        cmpGE(
          wind_ex_stacks,
          dm.squadBuffThreshold,
          subscript(phase, dm.squadAnomProf)
        )
      )
    ),
    showSpecialtyAndEquipped(key),
    true  // team buff
  ),

  // 7. Bool conditional — off-field toggle
  registerBuff(
    'offFieldEnerRegen',
    ownBuff.combat.enerRegen.add(
      cmpSpecialtyAndEquipped(
        key,
        offField.ifOn(subscript(phase, dm.offFieldEnerRegen))
      )
    ),
    showSpecialtyAndEquipped(key)
  ),

  // 8. Num conditional — stack-based team DMG
  registerBuff(
    'teamDmg_',
    teamBuff.combat.common_dmg_.add(
      cmpSpecialtyAndEquipped(
        key,
        prod(ex_fire_stacks, subscript(phase, dm.teamDmg_))
      )
    ),
    showSpecialtyAndEquipped(key),
    true  // team buff
  ),
)

export default sheet
```

**Key utilities:**
- `showSpecialtyAndEquipped(key)` — Standard show-condition (equipped by matching specialty)
- `cmpSpecialtyAndEquipped(key, valueNode)` — Guard value behind specialty+equipped check
- `allBoolConditionals(key)` — Creates on/off toggles
- `allNumConditionals(key, intOnly, min, max)` — Creates numeric spinners (stacks)
- `entriesForWengine(key)` — **Must be the first argument after `key`** in `registerWengine()`. Handles base stats and passive stat generation.

**Damage-type-scoped buffs — `.map()` vs `addWithDmgType()`:**

| Pattern | Use case | Example |
|---|---|---|
| `.map((r) => r.add(...))` on `ownBuff.combat.dmg_.{type}` | When a w-engine has dedicated sub-properties on `dmg_` (e.g. `dmg_.vortex`, `dmg_.windswept`). These are discrete damage type tags defined in the system. | Joyau Dore's Windswept/Vortex DMG buffs |
| `addWithDmgType('{type}', ...)` on `ownBuff.combat.common_dmg_` | For damage types that aren't sub-properties on `dmg_` (e.g. `'abloom'`, `'aftershock'`). Pass the type name as a string. | Frostfall Sickle's Abloom DMG buff |

**Attribute-scoped buffs — using sub-properties on `ownBuff.combat.*`:**

Some combat stats have attribute-specific sub-properties (e.g. `common_dmg_.ice`, `resIgn_.fire`). Use these when the buff only applies to a specific attribute:

```typescript
ownBuff.combat.common_dmg_.ice.add(value)     // Ice DMG only
ownBuff.combat.resIgn_.fire.add(value)        // Fire RES Ignore only
```

**Caveat:** When using attribute-scoped DMG buffs, you may also need to check the character's attribute via `cmpEq(own.char.attribute, 'ice', value)` to ensure the w-engine only works on matching characters.

**Base stat buffs (`ownBuff.base.*`):**

Use `ownBuff.base.*` instead of `ownBuff.combat.*` for raw base stat increases (not scaling with other modifiers):

```typescript
ownBuff.base.impact.add(value)     // Base Impact (not combat Impact)
ownBuff.base.atk.add(value)        // Base ATK
```

---

### 2. UI sheet (`app/src/formula-ui/wengine/sheets/{Name}.tsx`)

```typescript
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import { wengineAsset } from '../../../assets'
import type { WengineKey } from '../../../consts'
import { ChiefSidekick } from '../../../formula'
import { mappedStats } from '../../../stats'
import { tagToTagField, trans } from '../../util'
import { PhaseWrapper } from '../components'

const key: WengineKey = 'ChiefSidekick'
const [chg, ch] = trans('wengine', key)
const dm = mappedStats.wengine[key]
const icon = wengineAsset(key)
const cond = ChiefSidekick.conditionals
const buff = ChiefSidekick.buffs

const sheet: UISheetElement = {
  title: chg('phase'),
  img: icon,
  documents: [
    // Phase description (always first)
    {
      type: 'text',
      text: (
        <PhaseWrapper wKey={key}>
          {(phase) => chg(`phaseDescs.${phase - 1}`)}
        </PhaseWrapper>
      ),
    },
    // Always-on stat fields
    {
      type: 'fields',
      fields: [
        { title: 'Impact buff', fieldRef: buff.impact.tag },
      ],
    },
    {
      type: 'fields',
      fields: [
        { title: 'Fire RES Ignore', fieldRef: buff.fireResIgn_.tag },
      ],
    },
    // Conditional — bool toggle (off-field)
    {
      type: 'conditional',
      conditional: {
        label: ch('cond_offField'),
        metadata: cond.offField,
        fields: [tagToTagField(buff.offFieldEnerRegen.tag)],
      },
    },
    // Conditional — num stacks
    {
      type: 'conditional',
      conditional: {
        label: ch('cond'),
        metadata: cond.ex_fire_stacks,
        fields: [
          tagToTagField(buff.teamDmg_.tag),
          // Static value display (no tag dependency)
          { title: 'Duration', fieldValue: dm.duration },
        ],
      },
    },
  ],
}

export default sheet
```

- The sheet uses `UISheetElement` type (not `createBaseSheet`)
- Uses `documents` array (not `passive` section) — each entry is a document segment
- **Must import** `PhaseWrapper`, `wengineAsset`, `mappedStats`, and the formula sheet import
- `chg('phase')` as title, `chg('phaseDescs.${phase - 1}')` for phase description text
- `PhaseWrapper` component renders the phase-scoped description text
- `tagToTagField(tag)` converts a raw tag to a field display
- Fields can use `{ title, fieldRef }` or `tagToTagField()` or `{ title, fieldValue }` for static values
- Use `fieldValue` for values that don't depend on a conditional toggle (e.g. `dm.duration`)
- Each `type: 'fields'` or `type: 'conditional'` is a separate document entry

---

### 3. Generated conditionals (`app/src/formula/meta/wengine/{Name}/conditionals.ts`)

```typescript
export const conditionals = {
  offField: { sheet: '{Name}', name: 'offField', type: 'bool' },
  ex_fire_stacks: {
    sheet: '{Name}',
    name: 'ex_fire_stacks',
    type: 'num',
    int_only: true,
    min: 0,
    max: 5,
  },
}
```

---

### 4. Locale file (`app/src/localization/assets/locales/en/wengine_{Name}.json`)

```json
{
  "cond": "EX Special Fire stacks",
  "cond_offField": "Off-field ER"
}
```

- `"cond"` — default conditional label key
- `"cond_{name}"` — additional conditional labels

---

### 5. Custom description components (in `WEngineConditionalsDisplay.tsx`)

When a w-engine needs custom phase descriptions (splitting the generated phase desc into multiple parts), add helper functions before the component:

```typescript
function WengineNameImpactResDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_{Name}_gen')
  const fullDesc = t(`wengine_{Name}_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf('. ')
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx + 1)} />
}
```

Then wire them into:
- The `WenginePassiveFieldRow` section for field-specific descriptions
- The `WEngineConditionalsDisplay` filter/map section for conditional-specific descriptions
- The filter section to hide self-only conditionals from teammate view

---

## Summary checklist

### Character
- [ ] Create `app/src/formula/data/char/sheets/{Name}.ts`
- [ ] Create `app/src/formula-ui/char/sheets/{Name}.tsx`
- [ ] Create/update `app/src/formula/meta/char/{Name}/buffs.ts`
- [ ] Create/update `app/src/formula/meta/char/{Name}/conditionals.ts`
- [ ] Create/update `app/src/formula/meta/char/{Name}/formulas.ts` (if using `customDmg`)
- [ ] Create `app/src/localization/assets/locales/en/char_{Name}.json`
- [ ] Run `npx nx run-many -t gen-file` to regenerate if generators exist
- [ ] Run `bun run mini-ci` to verify

### W-Engine
- [ ] Create `app/src/formula/data/wengine/sheets/{Name}.ts`
- [ ] Create `app/src/formula-ui/wengine/sheets/{Name}.tsx`
- [ ] Create/update `app/src/formula/meta/wengine/{Name}/conditionals.ts`
- [ ] Create `app/src/localization/assets/locales/en/wengine_{Name}.json`
- [ ] (If needed) Add custom desc components in `WEngineConditionalsDisplay.tsx`
- [ ] Run `npx nx run-many -t gen-file` to regenerate if generators exist
- [ ] Run `bun run mini-ci` to verify
