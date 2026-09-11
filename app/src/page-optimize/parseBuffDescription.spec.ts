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
})
