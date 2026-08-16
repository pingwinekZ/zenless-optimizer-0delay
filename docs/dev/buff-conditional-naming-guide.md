# Buff & Conditional Naming Guide (Zenless Zone Zero)

This document codifies the naming conventions for buffs and conditionals as used in the Zenless Zone Zero Optimizer project. Follow these patterns when adding new agents, W-Engines, or any buff/conditional UI labels.

---

## 1. Core Categorization (What kind of conditional is it?)

Every conditional name should convey **what it is** in one of these categories:

| Category | Example Names |
|---|---|
| **Named buff / state** | `Sunflare state`, `Cheer On state`, `Ether Veil state`, `Abloom buff` |
| **Stack tracker** | `Flame Ember stacks`, `Crimson Thorn stacks`, `The Depths stacks` |
| **Squad buff** | `Squad AP buff`, `Squad ATK buff`, `Squad DMG buff` |
| **Self buff** | `ATK buff`, `CD buff`, `CR buff`, `SPD buff` |
| **Field / Zone** | `Zone active`, `Field active` |
| **Debuff / Shred** | `DEF shred`, `RES shred`, `PEN buff`, `RES ignore`, `M1 RES shred` |
| **Damage boost** | `DMG boost`, `Ult DMG buff`, `EX Special DMG boost`, `Chain Attack DMG boost`, `Disorder DMG boost` |
| **Conversion** | `ER to DMG% and AM`, `ATK to AP buff`, `HP to CR conversion` |
| **Multi-buff (consolidated)** | `M2 buffs`, `M4 buffs`, `M6 buffs` |
| **Combat CD / condition** | `Combat CD`, `Combat ATK`, `Combat ER` |
| **Initial (start-of-fight / bangboo)** | `Initial buff`, `Initial ATK buff`, `Initial DMG buff` |

---

## 2. Naming Templates (order of components)

Component order: **[Condition / Context] [Target / Scope] [Stat / Effect] [Kind Suffix]**

### Template A: Mindscape-gated buffs
```
M<N> [Target] [Stat] [kind]
```
- `M1 CR buff` — M1 grants CRIT Rate
- `M1 RES Ignore` — M1 grants RES Ignore
- `M2 Windswept and Vortex DMG%` — M2 boosts Windswept and Vortex damage
- `M4 ATK%` — M4 grants ATK%
- `M4 CD buff` — M4 grants CRIT DMG
- `M6 CR and DMG buff` — M6 grants CRIT Rate and DMG
- `M4 EX Special CR buff` — M4 grants CRIT Rate for EX Special Attack

> **Rule:** `M` + number + short description. Keep the description terse — no spaces between `M` and the number.

### Template B: Ability-triggered buffs
```
[Post|Pre] <Ability> [Target] [Stat] [kind]
```
- `Post Ult DMG buff` — after Ultimate, gain DMG buff
- `Post Ult ATK buff` — after Ultimate, gain ATK buff
- `Pre EX Special DEF buff` — before using EX Special Attack, gain DEF buff
- `Post Chain ATK buff` — after Chain Attack, gain ATK buff
- `Post Assist DMG buff` — after Assist, gain DMG buff

> **Rule:** Use `Post` / `Pre` (not `After` / `Before`). Capitalize the ability name.

### Template C: Enemy-conditional buffs
```
[Condition] [Stat] [kind]
```
- `Enemy debuffed CR buff` — CR buff when enemy is debuffed
- `Enemy HP ≤ 50% DMG boost` — DMG boost when enemy HP ≤ 50%
- `Enemy HP > 50% DMG buff` — DMG buff when enemy HP > 50%
- `Stunned enemy DMG buff` — DMG buff when enemy is Stunned
- `Defeated enemy ATK buff` — ATK buff stack on enemy defeat
- `Burning enemy DMG boost` — DMG boost when enemy is Burning
- `Shocked enemy CR buff` — CR buff when enemy is Shocked

### Template D: Squad-scoped buffs
```
[Squad|Team] [Stat] [kind]
```
- `Squad AP buff` — squad-wide Anomaly Proficiency
- `Squad ATK buff` — squad-wide ATK
- `Squad DMG buff` — squad-wide DMG boost
- `Team CR buff` — team-wide CRIT Rate
- `Squad PEN Ratio buff` — squad-wide PEN Ratio

> **Rule:** Prefer `Squad` for consistency with in-game terminology, but `Team` is also acceptable for brevity.

### Template E: Named agent mechanics
```
[Mechanic Name] [kind]
```
- `Sunflare state` — Pyrois' unique Sunflare mode
- `Cheer On state` — Lucy's Cheer On buff state
- `Ether Veil state` — Zhao's Ether Veil mode
- `Abloom buff` — Aria's Abloom damage buff
- `Afterburn state` — Burnice's Afterburn effect
- `Windbite state` — Velina's Windbite debuff
- `Idyllic Cadenza state` — Astra Yao's enhanced state (EX Special)
- `The Depths stacks` — Miyabi's stack mechanic
- `Crimson Thorn stacks` — stack mechanic
- `Frostburn Break` — unique mechanic name

### Template F: Converted/scaling stats
```
[Source Stat] to [Target Stat] [kind]
```
- `ER to DMG% and AM` — Energy Regen converted to DMG% and Anomaly Mastery
- `ATK to AP conversion` — ATK converted to Anomaly Proficiency
- `HP to CR conversion` — HP converted to CRIT Rate
- `ATK to DMG buff` — ATK converted to DMG boost

### Template G: Stack-based mechanics
```
[Stack Name] stacks
```
- `Flame Ember stacks`
- `Crimson Thorn stacks`
- `The Depths stacks`
- `Eclipse stacks`
- `Core Passive stacks`
- `Talent stacks`
- `Shield stacks`
- `Energy stacks`

> **Rule:** Always use `stacks` (plural) as the suffix. Always lowercase `stacks`.

### Template H: Ability enhancements
```
Enhanced [Ability]
```
- `Enhanced Basic` — Basic Attack is enhanced
- `Enhanced Special` — Special Attack is enhanced
- `Enhanced EX Special` — EX Special Attack is enhanced
- `Enhanced Ult` — Ultimate is enhanced
- `Enhanced state` — generic enhanced mode

### Template I: Extra hits
```
[Ability] extra hits
```
- `EX Special extra hits` — EX Special Attack has additional RNG hits
- `Basic extra hits` — Basic Attack has additional hits
- `Additional Attack extra hits` — Additional Attack has extra hits
- `Ult extra hits` — Ultimate has additional hits

> **Rule:** `extra hits` (plural). Also acceptable: `hits` alone for named mechanics.

### Template K: Section Header Pattern (Mindscape / Core displays)
```
[Section prefix]: [Consolidated description]
  [Field title 1]     [value]
  [Field title 2]     [value]
```

When a mindscape section (or any section) displays multiple buff values, use a **section header** with the `M<N>` prefix and consolidated description. Individual field titles within should **not** repeat the `M<N>` prefix since the header already identifies the section.

- `M2 ATK buff` (header) → field titles: `CP ATK%`, `CP ATK Cap`
- `M6 CR and DMG buff` (header) → field titles: `Tremolo and Tone Clusters DMG`, `CR buff`

> **Rule:** The section header carries the `M<N>` prefix. Field titles below it omit the prefix.
> **Rule:** For the `fieldRef` → `fieldValue` switch: use `fieldValue` (from mapped stats) instead of `fieldRef` (formula tags) when the value doesn't depend on a conditional toggle. This prevents `tagFieldMap` from leaking the header-prefixed title into hover tooltips.

### Template J: Initial / Start-of-fight buffs
```
Initial [Stat] [kind]
```
- `Initial ATK buff`
- `Initial DEF buff`
- `Initial DMG buff`
- `Initial CR buff`
- `Initial shield stacks`

> **Rule:** Prefer `Initial` for start-of-fight effects. For Bangboo-triggered effects, use `Bangboo` as a prefix (e.g., `Bangboo ATK buff`). Avoid generic phrases like "Start of battle".

---

## 3. Stat Keyword Conventions

| In-Game Term | Convention | Example |
|---|---|---|
| ATK | `ATK` | `ATK buff`, `M4 ATK%` |
| DEF | `DEF` | `DEF buff`, `DEF shred` |
| HP | `HP` | `HP buff`, `HP to CR conversion` |
| CRIT Rate | `CR` | `CR buff`, `CR boost`, `M1 CR buff` |
| CRIT DMG | `CD` | `CD buff`, `M4 CD buff`, `AA CD buff` |
| SPD | `SPD` | `SPD buff`, `SPD stacks` |
| Anomaly Proficiency | `AP` | `AP buff`, `Squad AP buff`, `ATK to AP conversion` |
| Anomaly Mastery | `AM` | `AM buff`, `ER to DMG% and AM` |
| DMG Boost | `DMG` | `DMG boost`, `Ult DMG buff`, `DMG%` |
| Impact | `Impact` | `Impact buff`, `Impact stacks` |
| Daze (buildup meter) | `Daze` | `Daze buff`, `Daze dealt`, `Daze buildup` |
| Stun (enemy state) | `Stun` | `Stun DMG bonus`, `Stunned enemy` |
| Energy / Energy Regen | `ER` | `ER buff`, `ER to DMG%`, `Initial ER` |
| PEN (flat) | `PEN` | `PEN buff`, `Squad PEN` |
| PEN Ratio | `PEN Ratio` | `PEN Ratio buff`, `Squad PEN Ratio` |
| DEF Ignore (% DEF ignore) | `DEF Ignore` | `DEF Ignore buff`, `AA Abloom DEF Ignore` |
| RES Ignore | `RES Ignore` | `RES Ignore`, `M1 RES Ignore` |
| Vulnerability | `Vulnerability` | `Vulnerability`, `M1 vulnerability` |
| Stun / Daze break | `Stun` / `Daze` | `Stun DMG bonus`, `Daze dealt buff` |
| Additional Attack | `Additional Attack` | `Additional Attack DMG`, `Additional Attack hits` |
| Aftershock | `Aftershock` | `Aftershock DMG`, `Aftershock hits` |
| Follow-up type effects | `Assist Follow-Up` | `Assist Follow-Up DMG` |
| Sheer DMG | `Sheer DMG` | `Sheer DMG buff`, `Sheer DMG` |
| Disorder | `Disorder` | `Disorder DMG boost`, `Disorder DMG` |
| Attribute Anomaly | `Anom` / `Anomaly` | `Anomaly DMG buff`, `Anom Buildup` |
| Decibels | `Decibels` | `Decibel gain`, `Decibel regen` |
| Abloom | `Abloom` | `Abloom DMG`, `Abloom CRIT DMG` |
| Afterburn | `Afterburn` | `Afterburn DMG`, `Afterburn stacks` |

---

## 4. Kind Suffix Conventions

Use consistent suffixes to indicate the *type* of effect:

| Suffix | Usage | Examples |
|---|---|---|
| `buff` | General stat increase (timed or named) | `ATK buff`, `SPD buff`, `Squad AP buff`, `CR buff` |
| `boost` | DMG or non-visible stat increase | `DMG boost`, `CR boost`, `Disorder DMG boost` |
| `stacks` | Accumulating count-based effect | `Flame Ember stacks`, `The Depths stacks` |
| `state` | Agent is in a special mode | `Sunflare state`, `Ether Veil state`, `Cheer On state` |
| `active` | A field/zone is deployed | `Zone active`, `Field active` |
| `buffs` | Multiple buffs combined into one toggle | `M2 buffs`, `M6 buffs`, `M6 Ult buffs` |
| `conversion` | One stat is converted to another | `ER to DMG% and AM`, `HP to CR conversion` |
| `shred` | Enemy defensive stat reduction (debuff) | `DEF shred`, `RES shred` |
| `Ignore` | Enemy defense/resistance penetration | `RES Ignore`, `DEF Ignore`, `M1 RES Ignore` |
| `hits` | Extra attack hits | `EX Special extra hits`, `Ult extra hits` |
| `debuff` | A negative status on enemies | `Enemy debuffed`, `DEF shred debuff`, `Windbite debuff` |

---

## 5. Capitalization & Spacing Rules

| Rule | Correct | Incorrect |
|---|---|---|
| Slash-separated stats get spaces | `CR / CD buffs` | `CR/CD buffs` |
| Ability names are capitalized | `Basic Attack`, `EX Special`, `Ult`, `Chain Attack`, `Assist` | `basic`, `ex special`, `ult` |
| Stats are FULLY UPPERCASED | `ATK`, `DEF`, `HP`, `SPD`, `CR`, `CD`, `AP`, `AM`, `ER` | `Atk`, `Spd`, `Ap` |
| Named ability field titles can spell out stat names for clarity | `Final Verdict CRIT DMG`, `AA Windswept and Vortex DMG%` | `Final Verdict CD` (too terse) |
| PEN / DMG used as stat names | `PEN`, `DMG`, `DMG%` | `Pen`, `Dmg`, `dmg%` |
| First word of label capitalized | `Squad AP buff` | `squad AP buff` |
| Prepositions/articles lowercase | `Buff on ally` | `Buff On Ally` |
| `M#` always has no space | `M1 CR buff`, `M4 ATK%` | `M 1 CR buff` |
| `≤` / `>` for HP thresholds | `Enemy HP ≤ 50% DMG boost` | `Enemy HP less than 50% DMG boost` |
| Core Passive prefix | `CP` (e.g. `CP CR buff`) | `Core Passive CR buff` |
| Additional Ability prefix | `AA` (e.g. `AA CD buff`) | `Additional Ability CD buff` |
| Damage type prefix in field titles | Trailing `%` for DMG stats | `AA Windswept and Vortex DMG%` | `AA Windswept and Vortex DMG` |
| Section header carries M prefix | Header has `M<N>`, field titles omit it | `M6 CR and DMG buff` (header) → `CR buff` (field) | `M6 CR buff` repeated in field title |
| CP prefix on Core Passive enhancements | `CP ATK%` when M2 enhances CP buff | `CP ATK%` | `ATK%` (unclear what's being enhanced) |

---

## 6. Consolidation Rule

**If a single conditional toggle grants more than one buff effect, consolidate the name as `buffs` (plural).**

- Multiple M2 effects → `M2 buffs`
- Multiple M6 effects → `M6 buffs`
- Multiple effects from the same Ultimate → `M6 Ult buffs`

**Exception:** If the effects are thematically distinct enough, split them into separate conditionals (e.g., `Squad AP buff` vs `Ult field active`).

---

## 7. Cheat Sheet: Quick Reference

### Agent Conditionals

```
[Mechanic name] buff              → Sunflare buff
[Mechanic name] state             → Ether Veil state
Squad [Stat] buff                 → Squad AP buff
Team [Stat] buff                  → Team ATK buff
[Ability] field active            → Field active
M<N> [stat] [kind]                → M1 CR buff
M<N> [context] [stat] [kind]      → M4 EX Special CR buff
[Stack] stacks                    → Flame Ember stacks
[Ability] extra hits              → EX Special extra hits
Post [Ability] [stat] [kind]      → Post Ult DMG buff
Enemy [condition] [stat] [kind]   → Stunned enemy DMG buff
Initial [stat] [kind]             → Initial ATK buff
[Stat] to [Stat] [kind]           → ATK to AP conversion
Enhanced [Ability]                → Enhanced Basic
CP [stat] [kind]                  → CP CR buff
AA [stat] [kind]                  → AA CD buff
```

### W-Engine Conditionals

```
Post [Ability] [stat] [kind]           → Post EX Special ATK buff
[W-Engine name] [stat] [kind]          → Weeping Cradle DMG buff
[Ability] [stat] stacks                → Ult ATK stacks
[Condition] [stat] [kind]              → Shielded ATK buff
[Stat] buff                            → CR buff
[Stat] Ignore                          → RES Ignore
[Stat] [kind]                         → DEF Ignore buff
[Mechanic] hits                        → Additional Attack hits
Squad [Stat] buff                      → Squad AP buff
Team [Stat] buff                       → Team DMG buff
[Mechanics] and [Mechanics] DMG buffs  → Windswept and Vortex DMG buffs
[Attribute] DMG and [Type] DMG buffs   → Ice DMG and Abloom DMG buffs
[Context] [Stat]                       → Off-field ER
```

---

## 8. Examples from Codebase (Annotated)

### Agent: Pyrois
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `AA CD buff` | `AA` + stat + `buff` | Additional Ability grants CRIT DMG |
| `M1 CR buff` | `M<N>` + stat + `buff` | M1 grants CRIT Rate |

### Agent: Velina
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `CP ER to DMG% and AM` | `CP` + source + to + target(s) | Core Passive converts ER to DMG% and Anomaly Mastery |
| `AA Windswept and Vortex DMG%` | `AA` + mechanic + `DMG%` | Additional Ability boosts Windswept and Vortex DMG |
| `M1 RES Ignore` | `M<N>` + stat + `Ignore` | M1 grants RES Ignore |
| `M2 Windswept and Vortex DMG%` | `M<N>` + mechanic + `DMG%` | M2 boosts Windswept and Vortex DMG |
| `M4 ATK%` | `M<N>` + stat + `%` | M4 grants ATK% |

### Agent: Zhao
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `CP CR buff` | `CP` + stat + `buff` | Core Passive CRIT Rate buff |
| `M4 CD buff` | `M<N>` + stat + `buff` | M4 CRIT DMG buff |
| `Final Verdict CRIT DMG` | Named mechanic + stat | Named ability stat |
| `M6 CR and DMG buff` | `M<N>` + stats + `buffs` | Consolidated M6 effects |

### Agent: Promeia
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `CP AM to AP and Abloom DMG%` | `CP` + conversion + mechanic | Core Passive converts AM to AP and Abloom DMG (section header) |
| &nbsp;&nbsp;`Anomaly Proficiency` | Auto-generated from tag | Field title from `fieldRef` tag — auto-spelled stat name |
| &nbsp;&nbsp;`Squad Abloom DMG` | Squad + mechanic + stat | Squad-wide Abloom DMG (from locale key) |
| `AA Presumption of Guilt state` | `AA` + mechanic + `state` | AA toggle for the debuff inflicted by EX Special |
| &nbsp;&nbsp;`Abloom DEF Ignore` | Mechanic + stat | Field title (no AA prefix — within conditional section) |
| `M2 AP buff` (section header) | `M<N>` + buff type (header) | Section header — field titles below drop the `M2` prefix |
| &nbsp;&nbsp;`Anomaly Proficiency` | Auto-generated from tag | Field title from `fieldForBuff` — value is flat +40 AP |
| &nbsp;&nbsp;`Trial by Cold Abloom DMG%` | Named mechanic + `DMG%` | Flat 120% multiplier scoped to Trial by Cold formula |
| `M6 RES Ignore` (section header) | `M<N>` + stat + `Ignore` | Section header for M6 |
| &nbsp;&nbsp;`Anomaly & Disorder DMG All-Attribute RES Ignore` | Damage types + stat | Full game-effect name from locale |

### Agent: Astra Yao
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `Idyllic Cadenza state` | Named mechanic + `state` | EX Special Idyllic Cadenza buff state |
| `CP ATK buff` | `CP` + stat + `buff` | Core Passive squad ATK buff |
| `M1 RES shred` | `M<N>` + stat + `shred` | M1 RES Reduction debuff (not RES Ignore — `shred` = enemy debuff) |
| `M2 ATK buff` (section header) | `M<N>` + buff type (header) | Section header — field titles below drop the `M2` prefix |
| &nbsp;&nbsp;`CP ATK%` | `CP` + `ATK%` | M2 improves CP ATK% value (field title) |
| &nbsp;&nbsp;`CP ATK Cap` | `CP` + stat + `Cap` | M2 improves CP max ATK cap (field title) |
| `M6 CR and DMG buff` (section header) | `M<N>` + stats + `buffs` (header) | Consolidated M6 section header — field titles drop `M6` prefix |
| &nbsp;&nbsp;`Tremolo and Tone Clusters DMG` | Named mechanic + `DMG` | MV multiplier for Tremolo and Tone Clusters (field title) |
| &nbsp;&nbsp;`CR buff` | Stat + `buff` | CRIT Rate buff (field title) |
| `M6 Capriccio CR buff` | `M<N>` + mechanic + stat + `buff` | Conditional toggle for Precise Assist Capriccio CRIT Rate |
| &nbsp;&nbsp;`Capriccio CRIT Rate` | Named mechanic + stat | Field title within conditional (no M prefix) |

### W-Engine: Sol Exuvia
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `CR buff` | Stat + `buff` | Generic CRIT Rate buff |

### W-Engine: Joyau Doré
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `AP buff` | Stat + `buff` | Anomaly Proficiency buff |
| `Squad AP buff` | `Squad` + stat + `buff` | Team-wide AP buff |
| `Windswept and Vortex DMG buffs` | Named mechanics + `DMG buffs` (stack label) | Consolidated stack-based DMG buff label (locale `cond` key) |

### W-Engine: Frostfall Sickle
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `Ice DMG and Abloom DMG buffs` | Attribute/Type + `DMG buffs` (consolidated) | Stack-based conditional boosting Ice and Abloom DMG (locale `cond` key) |

### W-Engine: Chief Sidekick
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `Team DMG buff` | `Team` + stat + `buff` (Template D) | Team-wide DMG buff per stack (locale `cond` key) |
| `Off-field ER` | Context + stat (Template H-like) | Bool toggle for off-field Energy Regen (locale `cond_offField` key) |

### W-Engine: Cannon Rotor
| Conditional `text` | Pattern | Notes |
|---|---|---|
| `Additional DMG` | Named mechanic | Bonus damage hit |

---
### Template L: CP-buff-enhancing field titles
```
CP [Stat] [kind]
```

When a mindscape buff enhances a **Core Passive** buff, prefix the field title with `CP` to clarify what it's modifying.

- `CP ATK%` — M2 increases CP ATK% conversion
- `CP ATK Cap` — M2 increases CP max ATK cap
- `CP CR Multiplier` — Zhao M6 increases CP CRIT Rate multiplier

> **Rule:** Use `CP` prefix on individual field titles (not on the section header). The header still uses `M<N>` prefix.

---

## 9. Consistency Checklist

Before finalizing a conditional name, verify:

- [ ] Does it follow one of the template patterns above?
- [ ] Is the stat keyword UPPERCASED per the stat table?
- [ ] Is the kind suffix consistent with similar effects?
- [ ] Are `M#` labels without spaces?
- [ ] Are slashes spaced (`CR / CD` not `CR/CD`)?
- [ ] If multiple buffs in one toggle, is the name plural (`buffs`)?
- [ ] Are `PEN` (flat), `PEN Ratio` (%), and `DEF Ignore` (%) each used for their correct stat — never interchangeably?
- [ ] Is `RES Ignore` used for resistance-ignoring effects (not `PEN` or `DEF Ignore`)?
- [ ] Is `DMG` for damage boosts and `buff` for visible stat increases?
- [ ] Are initial/start-of-fight effects prefixed with `Initial`?
- [ ] Are extra RNG hits labeled `extra hits`?
- [ ] Are Core Passive buffs prefixed with `CP`?
- [ ] Are Additional Ability buffs prefixed with `AA`?
- [ ] Are ability names correctly capitalized? (`Basic Attack`, `EX Special`, `Chain Attack`, `Assist`, `Ultimate`)
- [ ] For mindscape sections with multiple buff displays, is there a section header with `M<N>` prefix and do field titles omit it?
- [ ] If a mindscape buff enhances a Core Passive buff, are field titles prefixed with `CP`?
- [ ] Are `fieldValue` (static) displays used instead of `fieldRef` (tag-based) when the value doesn't depend on a conditional toggle, to avoid hover-tooltip M-prefix leakage through `tagFieldMap`?
