# Character Sheet Description Refactoring Guide

> Reference guide for updating character formula-ui sheets to use sliced
> descriptions with dimming support, following the pattern established in
> Soldier0Anby, Miyabi, Trigger, Evelyn, and Harumasa.

---

## Quick Overview

**Old style** (Sigrid, Jane, Lycaon, Rina, Nekomata):
- Uses `GameDesc`, `SkillGameDesc`, or `CoreGameDesc` for full descriptions
- Uses raw string summaries as descriptions
- No conditional dimming of trigger text

**New style** (Soldier0Anby, Miyabi, Trigger, Evelyn, Harumasa, Burnice):
- Slices descriptions with `GameDescSlice` to show only the relevant portion
- Wraps trigger/conditional text in `<AbilityBodyText>` for dimming
- Uses `<PrefixedLine>` for mindscape-gated lines (and generic `P` lines for potential buffs; Chain/Ultimate · Aftershock has no prefix and is always enabled)
- Potential is always max (P6) — locale contains only `desc` (no `descPotential` variant) and data uses `dm.potential.*[6]` directly

---

## Key Components (from `sheetUtil.tsx`)

### `GameDescSlice`

Renders a portion of a locale description between `from` and `to` markers.

```tsx
<GameDescSlice
  ns="char_Trigger_gen"
  key18="mindscapes.1.desc"
  from="The Stun DMG Multiplier"   // start marker (inclusive)
  to="Soul-Searching Gaze"         // end marker (exclusive)
/>
```

- `from` and `to` are substring matches on the translated text (including `<ct>` tags).
- Use `capitalize={true}` when the slice starts mid-sentence.
- The markers must be unique substrings within the description.

### `AbilityBodyText`

Wraps children in a dimmed container when the character's Additional Ability
trigger condition is **not** met (opacity 0.5). The trigger is determined by
checking whether any `ability_*` buff has a non-zero computed value.

```tsx
<AbilityBodyText characterKey={key}>
  <GameDescSlice
    ns="char_Evelyn_gen"
    key18="ability.desc.1"
    from="Evelyn's <ct color=#FFFFFF>Chain Attack</ct> and <ct color=#FFFFFF>Ultimate</ct> DMG increases by"
    to="125% of the original value."
  />
</AbilityBodyText>
```

### `PrefixedLine`

Renders a line with a prefix label (e.g. `"P"`, `"M4"`) that is
dimmed when the required gate is not met. For potential buffs the prefix is
always the generic `"P"` (no number); the Chain/Ultimate · Aftershock buff has
no prefix at all and is always enabled.

```tsx
// Generic potential buff (always max, dimmed only by gameplay, not potential level):
<PrefixedLine prefix="P" dimmed={false}>
  <GameDescSlice ns="char_Soldier0Anby_gen" key18="core.desc.6.1" from="The Aftershock CRIT DMG bonus" to="..." />
</PrefixedLine>

// Ability-linked potential buff:
<PrefixedLine prefix="P" dimmed={!active}>
  <GameDesc ns="char_Soldier0Anby_gen" key18="potential.desc.6" />
</PrefixedLine>

// Chain/Ultimate · Aftershock (always enabled, no prefix):
<GameDesc ns="char_Soldier0Anby_gen" key18="ability.desc.2" />
```

### `usePotentialDescKey` / `potentialDescKey` (deprecated, identity)

Previously returned the locale key with `.desc` → `.descPotential` swapped when
potential > 0. Now that potential is **always max (P6)** the locale generator
emits only `desc` (no `descPotential` variant) and data uses `dm.potential.*[6]`
directly. Both helpers are kept for API compatibility and now simply return
the input key unchanged.

```tsx
const key18 = usePotentialDescKey(key, 'char_Harumasa_gen', 'ability.desc.1')
// → 'ability.desc.1' (identity, always)
```

New code should use plain keys directly, e.g. `"ability.desc.2"` or
`"potential.desc.6"`, without calling this helper.

### `useAbilityActive(characterKey)`

Returns `true` when at least one `ability_*` buff evaluates to > 0 via the
calc engine. Useful for conditionally dimming ability descriptions outside of
`AbilityBodyText`.

```tsx
const active = useAbilityActive(key)
```

---

## Patterns by Section

### 1. Core Description (splitting multi-paragraph cores)

**Before** (Sigrid):
```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('patrolActiveCond'),
    description: <CoreGameDesc characterKey={key} paragraph={5} />,
    metadata: cond.patrolActive,
    fields: [fieldForBuff(buff.core_patrol_crit_)],
  },
}
```

**After** (Soldier0Anby — potential always max):
```tsx
function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const ns = 'char_Soldier0Anby_gen'
  const coreKey = `core.desc.${coreLevel}.0`
  const coreKey1 = `core.desc.${coreLevel}.1`
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={coreKey}
        from="Soldier 0 - Anby deals"
        to="of Soldier 0 - Anby's CRIT DMG"
      />
      <PrefixedLine prefix="P" dimmed={false}>
        <GameDescSlice
          ns={ns}
          key18={coreKey1}
          from="The Aftershock CRIT DMG bonus"
          to="Soldier 0 - Anby's CRIT DMG"
        />
      </PrefixedLine>
    </>
  )
}
```

The core uses `core.desc.<level>.0` (base) and `core.desc.<level>.1`
(potential) directly — no `descPotential` variant. The `P` line is always
enabled (`dimmed={false}`); generic `P` prefix is used for all potential
lines except Chain/Ultimate · Aftershock which has no prefix at all.

### 2. Ability Description (trigger dimming)

**Before** (Sigrid):
```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('contaminationCond'),
    description: (
      <>
        <GameDesc ns="char_Sigrid_gen" key18="ability.desc.0" />
        <div style={{ marginBottom: 8 }} />
        <GameDesc ns="char_Sigrid_gen" key18="ability.desc.2" />
      </>
    ),
    metadata: cond.contaminationActive,
    fields: [fieldForBuff(buff.ability_contamination_dmg_)],
  },
}
```

**After** (Trigger):
```tsx
{
  type: 'fields',
  description: (
    <>
      <GameDesc ns="char_Trigger_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Trigger_gen"
          key18="ability.desc.1"
          from="When Trigger's CRIT Rate exceeds"
          to="75%"
        />
      </AbilityBodyText>
    </>
  ),
  header: { icon: null, text: ch('ability_header') },
  fields: [...],
}
```

The pattern is:
1. `ability.desc.0` — always the trigger condition (passive prerequisite text)
2. Wrap it in `<AbilityBodyText>` so it dims when the ability is inactive
3. Use `GameDescSlice` to extract just the relevant stat-bonus part from
   `ability.desc.1` (or similar)

### 3. Ability Description (potential always max)

**Before**: No dimming.

**After** (Soldier0Anby / Harumasa — potential always max):
```tsx
function AbilityDescription() {
  const ns = 'char_Soldier0Anby_gen'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18="ability.desc.1"
          from="Soldier 0 - Anby's CRIT Rate increases by"
          to="10%"
        />
      </AbilityBodyText>
    </>
  )
}
```

No `usePotentialDescKey` call — the key is plain `ability.desc.1`. The locale
now contains the max-potential text directly (no `descPotential` branch).

### 4. Mindscape Description Slicing

**Before** (Sigrid):
```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('patrolActiveM4Cond'),
    description: (
      <GameDesc ns="char_Sigrid_gen" key18="mindscapes.4.desc" />
    ),
    metadata: cond.patrolActiveM4,
    fields: [fieldForBuff(buff.m4_dmg_)],
  },
}
```

**After** (Soldier0Anby / Miyabi):
```tsx
{
  type: 'conditional',
  conditional: {
    label: ch('m4_electric_resIgn'),
    description: (
      <GameDescSlice
        ns="char_Soldier0Anby_gen"
        key18="mindscapes.4.desc"
        from="When hitting an enemy marked with"
        to="Electric RES"
      />
    ),
    metadata: cond.m4_electric_resIgn,
    fields: [fieldForBuff(buff.m4_electric_resIgn_)],
  },
}
```

Slice the mindscape description to show only the part that describes the
conditional trigger and its effect.

### 5. Passive Core + Gated Mindscape Line

**Before**: Full `<CoreGameDesc>` or `<GameDesc>`.

**After** (Trigger):
```tsx
function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns="char_Trigger_gen"
          key18="mindscapes.1.desc"
          from="The Stun DMG Multiplier"
          to="Soul-Searching Gaze"
        />
      </PrefixedLine>
    </>
  )
}
```

### 6. Passive + Ability with Linked Gates (potential always max)

**Before**: Single full description.

**After** (Soldier0Anby):
```tsx
function AbilityConditionalDescription() {
  const active = useAbilityActive(key)
  const ns = 'char_Soldier0Anby_gen'
  const desc1 = 'ability.desc.1'
  const from = 'When the current active character is Soldier 0 - Anby'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice ns={ns} key18={desc1} from={from} to="Silver Star" />
      </AbilityBodyText>
      <PrefixedLine prefix="P" dimmed={!active}>
        <GameDesc ns={ns} key18="potential.desc.6" />
      </PrefixedLine>
    </>
  )
}

function PotentialDescription() {
  const ns = 'char_Soldier0Anby_gen'
  return <GameDesc ns={ns} key18="ability.desc.2" />
}
```

The ability-linked `P` line is gated only by `!active` (gameplay), not by
potential level — it always uses `potential.desc.6` (max). The Chain/Ultimate
· Aftershock buff (`ability.desc.2`) has no `PrefixedLine` at all and is
always enabled. Harumasa and Burnice follow the same pattern: Burnice's
potential description is `<PrefixedLine prefix="P" dimmed={false}>` with
`potential.desc.6` and no `minPotential` gates on its fields; Harumasa's
core `minPotential: 1` gates are removed.

---

## Checklist for Refactoring a Character Sheet

1. **Read the locale file** (`char_<Name>_gen.json`) to understand the
   description text and find good `from`/`to` markers.

2. **Read the formula data** (`app/src/formula/data/char/sheets/<Name>.ts`)
   and **buff definitions** (`app/src/formula/meta/char/<Name>/buffs.ts`) to
   understand what each buff/conditional does, so you can match descriptions
   to fields.

3. **For each section** (core, ability, mindscape, potential):

   - **Split multi-paragraph descriptions** into separate `GameDescSlice`
     components.
   - **Wrap trigger-condition text** (e.g. `ability.desc.0`) in
     `<AbilityBodyText>` for dimming.
   - **Slice descriptions** to show only the part relevant to the
     buff/conditional, removing boilerplate.
   - **Potential is always max** — use plain keys (`ability.desc.2`,
     `potential.desc.6`, `core.desc.<level>.1`) directly; `usePotentialDescKey`
     is deprecated (identity).
     - No `minPotential` gates on fields; `PrefixedLine` for potential uses
       generic `prefix="P"` (or no prefix for Chain/Ultimate · Aftershock).
   - **Use `<PrefixedLine>`** for mindscape-gated sub-lines (`prefix="M1"`…
     `M6`) and for generic `P` lines (`prefix="P"`), with the correct `dimmed`
     condition (`dimmed={mindscape < N}` or `dimmed={!active}`).
   - **Use `useEffectiveMindscape`** for mindscape-gated dimming (works with
     teammate overrides).

4. **Update imports**: Add any new components (`AbilityBodyText`,
   `PrefixedLine`, `useAbilityActive`, `GameDescSlice`, etc.) to the import
   statement. Do **not** add `usePotentialDescKey` for new code — it is
   deprecated.

5. **Test**: Verify that descriptions display correctly and dim when gates are
   not met. No swapping to potential variants is expected (always max).

---

## Common Gotchas

- **`from`/`to` markers must be exact substrings** of the translated text,
  including `<ct>` tags. If the locale changes, the markers break.
- **`AbilityBodyText` only dims** — it does not hide. The children are always
  rendered, just with `opacity: 0.5` when inactive.
- **`PrefixedLine` uses `opacity: 0.5`** for dimming, same as
  `AbilityBodyText`. Both set opacity on a wrapper div.
- **`usePotentialDescKey` / `potentialDescKey` are deprecated identity helpers**
  — they now always return the input key. Previously they swapped `.desc` →
  `.descPotential` when potential > 0; now potential is always max (P6) and
  the locale contains only `desc`/`potential.desc.6` (no `descPotential`).
- **`GameDescSlice` logs a warning** and returns `null` if the slice markers
  are not found. Check the console during development.
- **The `potential` section** in the sheet (`addlDocuments.potential`) is
  auto-created by `createBaseSheet` when the character has potential params.
  Only add custom content there when the auto-generated sheet is insufficient.
  Potential is always displayed at max — e.g. `potential.desc.6`,
  `ability.desc.2` with no `PrefixedLine` number, or generic `prefix="P"`.
