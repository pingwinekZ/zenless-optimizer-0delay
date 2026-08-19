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

**New style** (Soldier0Anby, Miyabi, Trigger, Evelyn, Harumasa):
- Slices descriptions with `GameDescSlice` to show only the relevant portion
- Wraps trigger/conditional text in `<AbilityBodyText>` for dimming
- Uses `<PrefixedLine>` for mindscape/potential-gated lines
- Swaps to potential variant descriptions when the character has potential

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

Renders a line with a prefix label (e.g. `"P1"`, `"M4"`, `"P2+"`) that is
dimmed when the required gate is not met.

```tsx
<PrefixedLine prefix="P1" dimmed={potential < 1}>
  <GameDescSlice ns="char_Soldier0Anby_gen" key18="..." from="..." to="..." />
</PrefixedLine>
```

### `usePotentialDescKey(characterKey, ns, key18)`

Returns the locale key with `.desc` → `.descPotential` (and `.params` →
`.paramsPotential`) swapped when the character has a potential level > 0 **and**
the potential variant key exists in the namespace.

```tsx
const key18 = usePotentialDescKey(key, 'char_Soldier0Anby_gen', 'ability.desc.1')
// → 'ability.descPotential.1' if potential > 0 and key exists
```

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

**After** (Soldier0Anby):
```tsx
function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const potential = char?.potential ?? 0
  const ns = 'char_Soldier0Anby_gen'
  const coreKey = usePotentialDescKey(
    key, ns, `core.desc.${coreLevel}${potential > 0 ? '.0' : ''}`
  )
  const coreKey1 = `core.descPotential.${coreLevel}.1`
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={coreKey}
        from={potential > 0 ? 'Soldier 0 - Anby deals' : "Soldier 0 - Anby's DMG"}
        to="of Soldier 0 - Anby's CRIT DMG"
      />
      <PrefixedLine prefix="P1" dimmed={potential < 1}>
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

### 3. Ability Description with Potential Variant

**Before**: No potential awareness.

**After** (Soldier0Anby):
```tsx
function AbilityDescription() {
  const ns = 'char_Soldier0Anby_gen'
  const desc1 = usePotentialDescKey(key, ns, 'ability.desc.1')
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18={desc1}
          from="Soldier 0 - Anby's CRIT Rate increases by"
          to="10%"
        />
      </AbilityBodyText>
    </>
  )
}
```

Use `usePotentialDescKey` for the key to get the potential variant automatically.

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

### 6. Passive + Ability with Linked Gates

**Before**: Single full description.

**After** (Soldier0Anby):
```tsx
function AbilityConditionalDescription() {
  const potential = useCharacter(key)?.potential ?? 0
  const active = useAbilityActive(key)
  const ns = 'char_Soldier0Anby_gen'
  const desc1 = usePotentialDescKey(key, ns, 'ability.desc.1')
  const from =
    potential > 0
      ? 'When the current active character is Soldier 0 - Anby'
      : 'When Soldier 0 - Anby is the active character'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice ns={ns} key18={desc1} from={from} to="Silver Star" />
      </AbilityBodyText>
      <PrefixedLine prefix="P2+" dimmed={!active || potential < 2}>
        <GameDesc ns={ns} key18={`potential.desc.${Math.max(potential, 2)}`} />
      </PrefixedLine>
    </>
  )
}
```

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
   - **Use `usePotentialDescKey`** for any key that may have a potential
     variant.
   - **Use `<PrefixedLine>`** for mindscape- or potential-gated sub-lines
     within a description, with the correct `dimmed` condition.
   - **Use `useEffectiveMindscape`** for mindscape-gated dimming (works with
     teammate overrides).

4. **Update imports**: Add any new components (`AbilityBodyText`,
   `PrefixedLine`, `usePotentialDescKey`, `useAbilityActive`,
   `GameDescSlice`, etc.) to the import statement.

5. **Test**: Verify that descriptions display correctly, dim when gates are
   not met, and swap to potential variants when expected.

---

## Common Gotchas

- **`from`/`to` markers must be exact substrings** of the translated text,
  including `<ct>` tags. If the locale changes, the markers break.
- **`AbilityBodyText` only dims** — it does not hide. The children are always
  rendered, just with `opacity: 0.5` when inactive.
- **`PrefixedLine` uses `opacity: 0.5`** for dimming, same as
  `AbilityBodyText`. Both set opacity on a wrapper div.
- **`usePotentialDescKey` returns the original key** if no potential variant
  exists or potential is 0. It does not change the key if the variant key
  is missing.
- **`GameDescSlice` logs a warning** and returns `null` if the slice markers
  are not found. Check the console during development.
- **The `potential` section** in the sheet (`addlDocuments.potential`) is
  auto-created by `createBaseSheet` when the character has potential params.
  Only add custom content there when the auto-generated sheet is insufficient.
