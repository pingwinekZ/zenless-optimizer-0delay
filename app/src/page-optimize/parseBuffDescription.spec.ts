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
})
