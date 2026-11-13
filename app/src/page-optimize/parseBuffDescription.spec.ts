import { describe, expect, it } from 'vitest'
import { parseBuffDescription } from './parseBuffDescription'

const FROST_REINS_DESC =
  "· For Agents with Attack specialty, their ATK <color=#2BAD00>increases by 25%</color>. When their <color=#FFFFFF>Basic Attack</color>, <color=#FFFFFF>EX Special Attack</color>, or <color=#FFFFFF>Chain Attack</color> hits an enemy, it ignores <color=#2BAD00>30%</color> of the target's <color=#98EFF0>Ice RES</color> and <color=#FE437E>Ether RES</color>."

describe('parseBuffDescription', () => {
  it('parses ATK increase with Attack specialty', () => {
    const { bonusStats } = parseBuffDescription(FROST_REINS_DESC)
    expect(
      bonusStats.filter((s) => s.tag.q === 'atk_' && s.value === 25)
    ).toHaveLength(1)
    expect(bonusStats.find((s) => s.tag.q === 'atk_')).toMatchObject({
      specialty: 'attack',
    })
  })

  it("parses typed RES ignore against target's attributes", () => {
    const { bonusStats } = parseBuffDescription(FROST_REINS_DESC)
    const ignores = bonusStats.filter((s) => s.tag.q === 'resIgn_')
    expect(ignores).toHaveLength(6)
    const byAttr = (attr: string) =>
      ignores
        .filter((s) => s.tag.attribute === attr)
        .map((s) => s.tag.damageType1)
        .sort()
    expect(byAttr('ice')).toEqual(['basic', 'chain', 'exSpecial'])
    expect(byAttr('ether')).toEqual(['basic', 'chain', 'exSpecial'])
    for (const s of ignores) {
      expect(s).toMatchObject({ value: 30, specialty: 'attack' })
    }
  })

  it('parses "target\'s <Attribute> RES" ignore without damage types', () => {
    const desc =
      "· When an Agent with Attack specialty hits an enemy, their attacks ignore 20% of the target's Ice RES."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'resIgn_', qt: 'combat', attribute: 'ice' },
        value: 20,
      }),
    ])
  })

  it('parses "target\'s All-DMG RES" ignore', () => {
    const desc =
      "· When Agents with Rupture specialty hit enemies with attacks, ignore 20% of the target's All-DMG RES."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'resIgn_', qt: 'combat' },
        value: 20,
      }),
    ])
  })

  it('still parses enemy-owned typed ignores', () => {
    const desc =
      '· Basic Attack, EX Special Attack, and Ultimate ignore 10% of enemy Physical RES.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats.filter((s) => s.tag.q === 'resIgn_')).toHaveLength(3)
  })

  it('parses PEN Ratio increase from Sharp Rupture buff', () => {
    const desc =
      "· Agent PEN Ratio <color=#2BAD00>increases by 5%</color>. When an attack hits an enemy, it ignores <color=#2BAD00>15%</color> of the target's <color=#2EB6FF>Electric RES</color>.\n· After an Agent uses an <color=#FFFFFF>EX Special Attack</color> or <color=#FFFFFF>Special Attack</color>, Sharp DMG <color=#2BAD00>increases by 20%</color> and DEF <color=#2BAD00>increases by 10%</color> for 20s. Repeated triggers reset the duration."
    const { bonusStats } = parseBuffDescription(desc)
    const penRatio = bonusStats.find((s) => s.tag.q === 'pen_')
    expect(penRatio).toBeDefined()
    expect(penRatio?.value).toBe(5)
  })

  it('parses "N% more <Attribute> DMG" with attribute from Gleaming Frost buff', () => {
    const desc =
      '· Agents with the <color=#FFFFFF>Attack</color> specialty deal <color=#2BAD00>20%</color> more <color=#98EFF0>Ice DMG</color>.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', attribute: 'ice' },
        value: 20,
        specialty: 'attack',
      }),
    ])
  })

  it('parses Dead End Butcher zone buff (anomaly DMG up, takes-reduced skipped, daze dealt down)', () => {
    const desc =
      '· DMG dealt to boss enemies by Attribute Anomaly is increased by 50%. While Notorious - Dead End Butcher is in <color=#FFFFFF>Ether Enhanced</color> state, the DMG it takes is reduced by 15%, and the Daze value dealt by Agents to it is reduced by 30%. Triggering <color=#FFFFFF>Disorder</color> on Notorious - Dead End Butcher immediately forces it to exit the <color=#FFFFFF>Ether Enhanced</color> state.'
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 50,
      }),
    ])
    expect(enemyStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dazeRed_' },
        value: 30,
        conditional: true,
      }),
    ])
  })

  it('parses "take N% more <DamageType> DMG" with max-stack scaling', () => {
    const desc =
      '· When an Agent inflicts an Attribute Anomaly on an enemy, the target enemy gains 1 stack of Blight Mark of the corresponding attribute, lasting 30s and stacking up to 2 times. Repeated triggers of same-attribute Blight Mark reset its duration. · For every stack of Blight Mark inflicted, the enemies <color=#FFAF2C>take 8% more Attribute Anomaly DMG</color>.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 16,
      }),
    ])
  })

  it('parses "takes N% bonus Anomaly DMG" with same-sentence stack scaling', () => {
    const desc =
      '· When Miasmic Fiend is affected by <color=#FFAF2C>Attribute Anomaly</color>, it takes 8% bonus Anomaly DMG from Agents, stacking up to 6 times.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 48,
        conditional: true,
      }),
    ])
  })

  it('parses per-stack CRIT DMG with "up to a maximum of N stacks" cap and comma Decibels', () => {
    const desc =
      "· When dealing sufficient DMG to the boss enemy's legs, Impaired will be triggered. <color=#FFAF2C>Upon successfully breaking the boss enemy's legs</color>, the Agent restores <color=#FFAF2C>1,000 Decibels</color>, and the boss gains 1 stack of <color=#FFFFFF>Disintegration</color> for 20 seconds, up to a maximum of 4 stacks. When the Agent's attacks hit an enemy, for each stack of <color=#FFFFFF>Disintegration</color> the target has, CRIT DMG is <color=#FFAF2C>increased by 25%</color>."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'enerRegen_', qt: 'combat' },
          value: 1000,
        }),
        expect.objectContaining({
          tag: { q: 'crit_dmg_', qt: 'combat' },
          value: 100,
        }),
      ])
    )
  })

  it('parses enemy Anomaly Buildup RES increase as enemy stat', () => {
    const desc =
      '· When the Miasma Priest switches phase, their Anomaly Buildup RES increases by 10% and CRIT DMG taken increases by 30%.'
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    expect(enemyStats).toEqual([
      expect.objectContaining({ tag: { q: 'anomBuildupRes_' }, value: 10 }),
    ])
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'crit_dmg_', qt: 'combat' },
        value: 30,
      }),
    ])
  })

  it('parses Thrall Contract/Self-Sacrifice stacks as enemy stats with max-stack scaling', () => {
    const desc =
      "· When Sobek and The Thrall alternate turns, The Thrall gains 1 stack of Contract and Self-Sacrifice. Contract and Self-Sacrifice can stack up to 3 times. Each stack of Contract increases All-Attribute Anomaly Buildup RES by 15%, each stack of Self-Sacrifice reduces The Thrall's DEF by 8%. When The Thrall is Stunned, CRIT DMG taken increases by 50%."
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    expect(enemyStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: { q: 'anomBuildupRes_' }, value: 45 }),
        expect.objectContaining({ tag: { q: 'defRed_' }, value: 24 }),
      ])
    )
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'crit_dmg_', qt: 'combat' },
        value: 50,
        conditional: true,
      }),
    ])
  })

  it('strips <Term> tags without breaking parsing', () => {
    const desc =
      '· When a Boss accumulates 10 points of Dissonance, all Dissonance points are immediately removed and the Boss enters the Dissonant state. While in the Dissonant state, enemies take <color=#2BAD00>40% bonus Attribute Anomaly DMG</color> for 10s.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 40,
        conditional: true,
      }),
    ])
  })

  it('scopes a mid-sentence specialty to its own clause (Collapse buff)', () => {
    const desc =
      "· Agent <color=#FE437E>Ether DMG</color> and <color=#F0D12B>Physical DMG</color> <color=#2BAD00>increase by 25%</color>, and Daze dealt by Agents with the <color=#FFFFFF>Stun</color> specialty <color=#2BAD00>increases by 20%</color>.\n· After an Agent stuns an enemy, the enemy's Stun DMG Multiplier <color=#2BAD00>increases by 40%</color> and they recover from Stun <color=#2BAD00>15% slower</color> for 20s. Repeated triggers reset the duration."
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    // Ether/Physical DMG apply to every Agent; only the Daze clause is Stun-scoped
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', attribute: 'ether' },
        value: 25,
      }),
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', attribute: 'physical' },
        value: 25,
      }),
      expect.objectContaining({
        tag: { q: 'dazeInc_', qt: 'combat' },
        value: 20,
        specialty: 'stun',
      }),
    ])
    expect(bonusStats[0].specialty).toBeUndefined()
    expect(bonusStats[1].specialty).toBeUndefined()
    expect(enemyStats).toEqual([
      expect.objectContaining({
        tag: { q: 'stun_' },
        value: 40,
        conditional: true,
      }),
    ])
  })

  it('treats "attacks ignore" as an untyped RES ignore (Ultimate Edge buff)', () => {
    const desc =
      '· Agent Sharp DMG increases by 15%, and their DEF increases by 15%.\n· After an Agent uses an EX Special Attack, Special Attack or Ultimate, attacks ignore 20% of enemy Electric RES on hit for 20s. Repeated triggers reset the duration.'
    const { bonusStats } = parseBuffDescription(desc)
    // The damage-type list qualifies the trigger, not the ignore itself
    expect(bonusStats.filter((s) => s.tag.q === 'resIgn_')).toEqual([
      expect.objectContaining({
        tag: { q: 'resIgn_', qt: 'combat', attribute: 'electric' },
        value: 20,
        conditional: true,
      }),
    ])
  })

  it('parses a shared "<Type> DMG and <Type> DMG" list (Frigidity buff)', () => {
    const desc =
      '· When an Agent triggers Abloom or Disorder on an enemy, Attribute Anomaly DMG and Disorder DMG dealt by the whole squad increase by 25%, and their Buildup Rate increases by 15% for 15s.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats.filter((s) => s.tag.q === 'dmg_')).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 25,
        conditional: true,
      }),
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'disorder' },
        value: 25,
        conditional: true,
      }),
    ])
  })

  it('does not carry specialty into a new-subject sentence (Knife Edge buff)', () => {
    const desc =
      '· For Agents with the Stun specialty, Daze dealt by their EX Special Attack increases by 20%. After an Agent uses an EX Special Attack or Special Attack, Electric DMG and Wind DMG increase by 30% for 15s.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats.filter((s) => s.tag.q === 'dazeInc_')).toEqual([
      expect.objectContaining({ value: 20, specialty: 'stun' }),
    ])
    const dmgStats = bonusStats.filter((s) => s.tag.q === 'dmg_')
    expect(dmgStats.map((s) => s.tag.attribute).sort()).toEqual([
      'electric',
      'wind',
    ])
    for (const s of dmgStats) expect(s.specialty).toBeUndefined()
  })

  it('scales per-stack values by "gains N stacks" and "(max N stacks)" (Into Flames)', () => {
    const desc =
      '· After Scorched Horizon activates Gale Scorcher, they gain 5 stacks of Into Flames. Each stack of Into Flames increases DMG dealt by 10%. With Into Flames stacks, every time Scorched Horizon is inflicted with an Anomaly, one stack is lost, and subsequent Abloom DMG taken increases by 10% for 15s (max 3 stacks).'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat' },
        value: 50,
      }),
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'abloom' },
        value: 30,
      }),
    ])
  })

  it('maps "N% bonus Sharp DMG" to sharp_dmg_ (Integrated - Girtablullu)', () => {
    const desc =
      '· While in the Dissonant state, enemies take 40% bonus Attribute Anomaly DMG and 75% bonus Sharp DMG for 10s.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 40,
        conditional: true,
      }),
      expect.objectContaining({
        tag: { q: 'sharp_dmg_', qt: 'combat' },
        value: 75,
        conditional: true,
      }),
    ])
  })

  it('scopes PEN Ratio to the listed hit types and drops one-time Energy', () => {
    const desc =
      "· Agent Sharp DMG increases by 20%. After defeating normal enemies, Agents with the Stun specialty restore 15 Energy.\n· When Agents' Basic Attack, Special Attack, and Ultimate hit enemies, PEN Ratio increases by 10%. If the enemy is Stunned, ignore 15% of their Electric RES."
    const { bonusStats } = parseBuffDescription(desc)
    const penStats = bonusStats.filter((s) => s.tag.q === 'pen_')
    expect(penStats.map((s) => s.tag.damageType1).sort()).toEqual([
      'basic',
      'special',
      'ult',
    ])
    for (const s of penStats)
      expect(s).toMatchObject({ value: 10, conditional: true })
    expect(bonusStats.filter((s) => s.tag.q === 'enerRegen_')).toEqual([])
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'sharp_dmg_', qt: 'combat' },
          value: 20,
        }),
        expect.objectContaining({
          tag: { q: 'resIgn_', qt: 'combat', attribute: 'electric' },
          value: 15,
          conditional: true,
        }),
      ])
    )
  })

  it('keeps Anomaly Proficiency next to a DMG clause (Blazing Radiance)', () => {
    const desc =
      "· <color=#FFFFFF>Anomaly</color> specialty Agents' ATK <color=#2BAD00>increases by 10%</color>, and <color=#FF5521>Fire Anomaly Buildup Rate</color> <color=#2BAD00>increases by 10%</color>.\n· When an Agent deals <color=#FFFFFF>Attribute Anomaly</color> DMG and triggers a critical hit, the whole squad's Anomaly Proficiency <color=#2BAD00>increases by 30</color> and Attribute Anomaly DMG <color=#2BAD00>increases by 10%</color> for 15s; repeated triggers reset the duration."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'atk_', qt: 'combat' },
          value: 10,
          specialty: 'anomaly',
        }),
        expect.objectContaining({
          tag: { q: 'anomProf', qt: 'combat' },
          value: 30,
          conditional: true,
        }),
        expect.objectContaining({
          tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
          value: 10,
          conditional: true,
        }),
      ])
    )
    // The DMG pre-pass used to swallow the Proficiency clause and keep only
    // the DMG half of the sentence.
    expect(bonusStats.filter((s) => s.tag.q === 'anomProf')).toHaveLength(1)
    // Anomaly Buildup Rate buffs are intentionally not parsed.
    expect(bonusStats.filter((s) => s.tag.q === 'anomMas_')).toEqual([])
  })

  it('does not parse Anomaly Buildup Rate / Anomaly Buildup buffs', () => {
    const desc =
      '· Agent Ether Anomaly Buildup Rate and Physical Anomaly Buildup Rate increase by 25%.\n· While Corruptive Barrier is active, Anomaly DMG dealt by Agents is increased by 50%, and Anomaly Buildup is increased by 30%.'
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 50,
      }),
    ])
    expect(enemyStats).toEqual([])
  })

  it('scopes a multi-attribute stat list to each Attribute (Wind and Ice CRIT DMG)', () => {
    const desc =
      "· While the Boss is Stunned, <color=#FFAF2C>Sharp DMG</color> dealt by the whole squad's Agents increases by 60%, <color=#A6C5FD>Wind</color> and <color=#98EFF0>Ice</color> CRIT DMG dealt increases by 80% and ignores 40% of the Boss's DEF."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats.filter((s) => s.tag.q === 'crit_dmg_')).toEqual([
      expect.objectContaining({
        tag: { q: 'crit_dmg_', qt: 'combat', attribute: 'wind' },
        value: 80,
        conditional: true,
      }),
      expect.objectContaining({
        tag: { q: 'crit_dmg_', qt: 'combat', attribute: 'ice' },
        value: 80,
        conditional: true,
      }),
    ])
  })

  it('scopes a single-attribute stat to its Attribute (Storm Tribulation)', () => {
    const desc =
      "· Agents' <color=#A6C5FD>Wind DMG</color> increases by 40%, and <color=#A6C5FD>Wind CRIT DMG</color> increases by 40%.\n· <color=#FFFFFF>Attack</color> specialty Agents' ATK increases by 25%, and Basic Attack DMG increases by 40%."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'dmg_', qt: 'combat', attribute: 'wind' },
          value: 40,
        }),
        expect.objectContaining({
          tag: { q: 'crit_dmg_', qt: 'combat', attribute: 'wind' },
          value: 40,
        }),
      ])
    )
  })

  it('applies "X or Y specialty" stats to both specialties (Corroding Edge)', () => {
    const desc =
      "· Agents' <color=#2EB6FF>Electric DMG</color> <color=#2BAD00>increases by 30%</color>, Sharp DMG <color=#2BAD00>increases by 10%</color>.\n· <color=#FFFFFF>Attack</color> or <color=#FFFFFF>Armorer</color> specialty Agents' PEN Ratio <color=#2BAD00>increases by 20%</color>, and DMG dealt by <color=#FFFFFF>Special Attack</color> and <color=#FFFFFF>EX Special Attack</color> <color=#2BAD00>increases by 30%</color>."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats.filter((s) => s.tag.q === 'pen_')).toEqual([
      expect.objectContaining({
        tag: { q: 'pen_', qt: 'combat' },
        value: 20,
        specialty: 'attack',
      }),
      expect.objectContaining({
        tag: { q: 'pen_', qt: 'combat' },
        value: 20,
        specialty: 'armorer',
      }),
    ])
    const specialDmg = bonusStats.filter((s) => s.tag.q === 'dmg_')
    expect(specialDmg.map((s) => s.specialty).sort()).toEqual([
      'armorer',
      'armorer',
      'attack',
      'attack',
    ])
  })

  it('parses "ignores N% of the Boss\'s DEF" as DEF ignore, not a DEF buff', () => {
    const desc =
      "· After Shutdown against a Boss enemy's Control Skill, <color=#FFAF2C>Daze</color> dealt by the whole squad's Agents increases by 15%, <color=#FFAF2C>DEF</color> increases by 30%.\n· While the Boss is Stunned, <color=#FFAF2C>Sharp DMG</color> dealt by the whole squad's Agents increases by 60%, <color=#A6C5FD>Wind</color> and <color=#98EFF0>Ice</color> CRIT DMG dealt increases by 80% and ignores 40% of the Boss's DEF."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'defIgn_', qt: 'combat' },
          value: 40,
          conditional: true,
        }),
      ])
    )
    expect(bonusStats.filter((s) => s.tag.q === 'def_')).toEqual([
      expect.objectContaining({ value: 30 }),
    ])
  })

  it('parses "the enemy\'s <Attribute> RES reduces by N%" (Tempest Flames)', () => {
    const desc =
      "· <color=#FFFFFF>Attack</color> specialty Agents' ATK increases by 35%, and <color=#A6C5FD>Wind DMG</color> increases by 20%.\n· When an Agent's <color=#FFFFFF>Ultimate</color> hits an enemy, the enemy's <color=#A6C5FD>Wind RES</color> reduces by 15% for 30s; repeated triggers reset the duration."
    const { bonusStats, enemyStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: { q: 'atk_', qt: 'combat' },
          value: 35,
          specialty: 'attack',
        }),
      ])
    )
    expect(enemyStats).toEqual([
      expect.objectContaining({
        tag: { q: 'resRed_', attribute: 'wind' },
        value: 15,
        conditional: true,
      }),
    ])
  })

  it('does not scope a whole-squad buff to the specialty that triggers it (Blazing Nightfire)', () => {
    const desc =
      "· Agents with the <color=#FFFFFF>Anomaly</color> specialty that deal <color=#FFFFFF>Attribute Anomaly</color> DMG and trigger a CRIT increase the whole squad's ATK by 10% and Attribute Anomaly DMG by 20% for 15s; repeated triggers reset the duration."
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'atk_', qt: 'combat' },
        value: 10,
      }),
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 20,
      }),
    ])
    for (const s of bonusStats) expect(s.specialty).toBeUndefined()
  })

  it('uses the higher split value without squad-count gating (Turbulent Resonance)', () => {
    const desc =
      '· If there are 2/3 Agents with the Anomaly specialty in the squad, Attribute Anomaly DMG dealt by Agents increases by 10%/60%, and the whole squad initially gains 500/1,500 Decibels upon entering combat.'
    const { bonusStats } = parseBuffDescription(desc)
    expect(bonusStats).toEqual([
      expect.objectContaining({
        tag: { q: 'dmg_', qt: 'combat', damageType1: 'anomaly' },
        value: 60,
        conditional: true,
      }),
    ])
  })
})
