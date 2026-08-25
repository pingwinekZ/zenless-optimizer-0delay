import {
  compileTagMapValues,
  read,
  setDebugMode,
} from '@zenless-optimizer/pando/engine'
import { fail } from 'assert'
import type { MilestoneKey, WengineKey } from '../consts'
import {
  allCharacterKeys,
  allDiscSetKeys,
  allWengineKeys,
  type CharacterKey,
} from '../consts'
import {
  charTagMapNodeEntries,
  conditionals,
  discTagMapNodeEntries,
  formulas,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { data, keys, values } from './data'
import {
  conditionalEntries,
  convert,
  enemy,
  enemyDebuff,
  enemyTag,
  own,
  ownBuff,
  ownTag,
  reader,
  type TagMapNodeEntries,
  tagStr,
  team,
} from './data/util'

setDebugMode(true)
// This is generally unnecessary, but without it, some tags in `DebugCalculator` will be missing
Object.assign(values, compileTagMapValues(keys, data))
describe('read test', () => {
  it('Throws an error when trying to add to dmg_ without modifier', () => {
    expect(() => ownBuff.final.dmg_.add(1)).toThrowError('dmg_')
    ownBuff.final.dmg_.ice.add(1)
  })
})

describe('character test', () => {
  it.each([
    [1, 0, 0, 95, 49, 603, 118, 94, 93],
    [10, 0, 0, 143, 109, 1339.5834, 118, 94, 93],
    [10, 1, 0, 177, 143, 1753.5834, 118, 94, 93],
    [20, 2, 0, 266, 244, 2986.0094, 118, 94, 93],
    [60, 5, 0, 583, 612, 7500.7134, 118, 94, 93],
    [60, 5, 3, 608, 612, 7500.7134, 130, 94, 93],
    [60, 5, 6, 658, 612, 7500.7134, 136, 94, 93],
  ])(
    'Calculate character base stats for lvl %i, promo %i, core %i',
    (lvl, promotion, core, atk, def, hp, impact, anomMas, anomProf) => {
      const charKey: CharacterKey = 'Anby'
      const data: TagMapNodeEntries = [
        ...withMember(
          'Anby',
          ...charTagMapNodeEntries({
            level: lvl,
            promotion,
            key: charKey,
            mindscape: 0,
            potential: 0,
            basic: 0,
            dodge: 0,
            special: 0,
            assist: 0,
            chain: 0,
            core,
            potential: 0,
          })
        ),
      ]
      const calc = new Calculator(keys, values, compileTagMapValues(keys, data))

      const anby = convert(ownTag, { et: 'own', src: 'Anby' })
      expect(calc.compute(anby.final.atk).val).toBeCloseTo(atk)
      expect(calc.compute(anby.final.def).val).toBeCloseTo(def)
      expect(calc.compute(anby.final.hp).val).toBeCloseTo(hp)
      expect(calc.compute(anby.final.impact).val).toBeCloseTo(impact)
      expect(calc.compute(anby.final.anomMas).val).toBeCloseTo(anomMas)
      expect(calc.compute(anby.final.anomProf).val).toBeCloseTo(anomProf)
    }
  )
})

describe('wengine test', () => {
  it.each([
    [0, 0, 40, 0.2],
    [10, 0, 102, 0.2],
    [10, 1, 138, 0.26],
    [60, 5, 594, 0.5],
  ])(
    'Calculate wengine base stats for lvl %i, mod %i',
    (lvl, modification, atk, substat) => {
      const wengKey: WengineKey = 'SteamOven'
      const data: TagMapNodeEntries = [
        ...withMember(
          'Anby',
          ...charTagMapNodeEntries({
            level: 1,
            promotion: 0,
            key: 'Anby',
            mindscape: 0,
            potential: 0,
            basic: 0,
            dodge: 0,
            special: 0,
            assist: 0,
            chain: 0,
            core: 0,
            potential: 0,
          }),
          ...wengineTagMapNodeEntries({
            key: wengKey,
            level: lvl,
            modification: modification as MilestoneKey,
            phase: 1,
          })
        ),
      ]
      const calc = new Calculator(keys, values, compileTagMapValues(keys, data))

      const wengine0 = convert(ownTag, {
        et: 'own',
        src: 'Anby',
        sheet: 'wengine',
      })
      expect(calc.compute(wengine0.base.atk).val).toBeCloseTo(atk)
      expect(calc.compute(wengine0.initial.enerRegen_).val).toBeCloseTo(substat)
    }
  )
})

describe('char+wengine test', () => {
  it('calculate base stats', () => {
    const data: TagMapNodeEntries = [
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 1,
          promotion: 0,
          key: 'Anby',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: 'SteamOven',
          level: 0,
          modification: 0,
          phase: 1,
        })
      ),
    ]
    const calc = new Calculator(keys, values, compileTagMapValues(keys, data))
    const anby = convert(ownTag, { et: 'own', src: 'Anby' })
    expect(calc.compute(anby.final.atk).val).toBeCloseTo(135)
  })
  it('calculate base+initial+combat stats', () => {
    const data: TagMapNodeEntries = [
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 60,
          promotion: 5,
          key: 'Anby',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 6,
        }),
        ...wengineTagMapNodeEntries({
          key: 'VortexRevolver',
          level: 60,
          modification: 5,
          phase: 1,
        }),
        ownBuff.initial.atk.add(25),
        ownBuff.combat.atk.add(100),
        ownBuff.combat.atk_.add(0.08)
      ),
    ]
    const calc = new Calculator(keys, values, compileTagMapValues(keys, data))
    const anby = convert(ownTag, { et: 'own', src: 'Anby' })
    expect(calc.compute(anby.base.atk).val).toBeCloseTo(1133)
    expect(calc.compute(anby.final.atk).val).toBeCloseTo(1595.368)
  })
  it.each([
    [false, 'avg', 4457.554695746249, 14858.5156524875],
    [false, 'crit', 5253.9159754967395, 14858.5156524875],
    [false, 'nonCrit', 2068.470856494779, 14858.5156524875],
    [true, 'avg', 6686.332043619374, 22287.773478731247],
    [true, 'crit', 7880.87396324511, 22287.773478731247],
    [true, 'nonCrit', 3102.7062847421685, 22287.773478731247],
  ])(
    'calculate standard+anomaly damage, stunned: %o, critMode: %s',
    (isStunned, critMode, expectedStandardDmg, expectedAnomalyDmg) => {
      const data: TagMapNodeEntries = [
        ...withMember(
          'Anby',
          ...charTagMapNodeEntries({
            level: 60,
            promotion: 5,
            key: 'Anby',
            mindscape: 0,
            potential: 0,
            basic: 0,
            dodge: 0,
            special: 0,
            assist: 0,
            chain: 0,
            core: 6,
            potential: 0,
          }),
          ...wengineTagMapNodeEntries({
            key: 'VortexRevolver',
            level: 60,
            modification: 5,
            phase: 1,
          }),

          ownBuff.initial.atk.add(25),
          ownBuff.combat.atk.add(100),
          ownBuff.combat.atk_.add(0.08),
          ownBuff.initial.crit_.add(0.7),
          ownBuff.initial.crit_dmg_.add(1.04),
          ownBuff.initial.dmg_.electric.add(0.4),
          ownBuff.initial.pen_.add(0.05),
          ownBuff.initial.pen.add(90),
          ownBuff.initial.resIgn_.add(0.02),
          ownBuff.initial.anomProf.add(338)
        ),
        own.common.critMode.add(critMode),
        enemy.common.def.add(635),
        enemy.common.res_.electric.add(0.1),
        conditionalEntries(
          'enemy',
          'Anby',
          null
        )(conditionals.enemy.isStunned.name, isStunned ? 1 : 0),
        enemyDebuff.common.resRed_.electric.add(0.15),
        enemyDebuff.common.dmgInc_.add(0.1),
        enemyDebuff.common.dmgRed_.add(0.15),
        enemyDebuff.common.stun_.add(1.5),
        enemyDebuff.common.unstun_.add(1),
      ]
      const calc = new Calculator(keys, values, compileTagMapValues(keys, data))
      const anby = convert(ownTag, { et: 'own', src: 'Anby' })
      expect(calc.compute(anby.base.atk).val).toBeCloseTo(1133)
      expect(calc.compute(anby.final.atk).val).toBeCloseTo(1595.368)

      expect(
        calc
          .withTag({ src: 'Anby', dst: 'Anby' })
          .compute(read(formulas.Anby.standardDmgInst.tag, undefined)).val
      ).toBeCloseTo(expectedStandardDmg)

      expect(
        calc
          .withTag({ src: 'Anby', dst: 'Anby' })
          .compute(read(formulas.Anby.anomalyDmgInst.tag, undefined)).val
      ).toBeCloseTo(expectedAnomalyDmg)
    }
  )
  it('calculate specific elemental damage bonus separate from common', () => {
    const data: TagMapNodeEntries = [
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 60,
          promotion: 5,
          key: 'Anby',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 6,
        }),
        ...wengineTagMapNodeEntries({
          key: 'VortexRevolver',
          level: 60,
          modification: 5,
          phase: 1,
        }),

        ownBuff.initial.atk.add(25),
        ownBuff.combat.atk.add(100),
        ownBuff.combat.atk_.add(0.08),
        ownBuff.initial.crit_.add(0.7),
        ownBuff.initial.crit_dmg_.add(1.04),
        ownBuff.initial.common_dmg_.add(0.2),
        ownBuff.initial.dmg_.electric.add(0.4),
        ...ownBuff.combat.dmg_.electric.addWithDmgType('chain', 0.3),
        ownBuff.initial.pen_.add(0.05),
        ownBuff.initial.pen.add(90),
        ownBuff.initial.resIgn_.add(0.02),
        ownBuff.initial.anomProf.add(338)
      ),
      own.common.critMode.add('avgHit'),
      enemy.common.def.add(635),
      enemy.common.res_.electric.add(0.1),
      conditionalEntries('enemy', 'Anby', null)('isStunned', 1),
      enemyDebuff.common.resRed_.electric.add(0.15),
      enemyDebuff.common.dmgInc_.add(0.1),
      enemyDebuff.common.dmgRed_.add(0.15),
      enemyDebuff.common.stun_.add(1.5),
      enemyDebuff.common.unstun_.add(1),
    ]
    const calc = new Calculator(keys, values, compileTagMapValues(keys, data))
    const anby = convert(ownTag, { et: 'own', src: 'Anby' })
    expect(calc.compute(anby.final.dmg_).val).toBeCloseTo(0)
    expect(calc.compute(anby.final.dmg_.electric).val).toBeCloseTo(0.4)
    expect(calc.compute(anby.final.dmg_.electric.chain[0]).val).toBeCloseTo(0.7)
    expect(calc.compute(anby.final.dmg_.electric.chain[1]).val).toBeCloseTo(0.7)
    expect(calc.compute(anby.final.dmg_.chain[0]).val).toBeCloseTo(0)
    expect(calc.compute(anby.final.dmg_.chain[1]).val).toBeCloseTo(0)
    expect(calc.compute(anby.final.common_dmg_).val).toBeCloseTo(0.2)
  })
})

describe('disc2p test', () => {
  it('calculate initial stats', () => {
    const data: TagMapNodeEntries = [
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 1,
          promotion: 0,
          key: 'Anby',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 0,
        }),
        ...discTagMapNodeEntries({ atk: 100 }, { BranchBladeSong: 2 })
      ),
    ]
    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, data)
    ).withTag({ src: 'Anby', dst: 'Anby' })
    const anby = convert(ownTag, { et: 'own', src: 'Anby' })
    expect(calc.compute(anby.final.atk).val).toBeCloseTo(195)
    expect(calc.compute(anby.final.crit_dmg_).val).toBeCloseTo(0.66)
  })
})

describe('team', () => {
  test('can count faction and specialty', () => {
    const data: TagMapNodeEntries = [
      ...teamData(['Anby', 'Anton']),
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 1,
          promotion: 0,
          key: 'Anby',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 0,
        }),
        ownBuff.common.count.withSpecialty('attack').add(1),
        ownBuff.common.count.withFaction('CunningHares').add(1)
      ),
      ...withMember(
        'Anton',
        ...charTagMapNodeEntries({
          level: 1,
          promotion: 0,
          key: 'Anton',
          mindscape: 0,
          potential: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          assist: 0,
          chain: 0,
          core: 0,
        }),
        ownBuff.common.count.withSpecialty('stun').add(1),
        ownBuff.common.count.withFaction('BelebogHeavyIndustries').add(1)
      ),
    ]
    const calc = new Calculator(keys, values, compileTagMapValues(keys, data))
    expect(calc.compute(team.common.count.withSpecialty('attack')).val).toEqual(
      1
    )
    expect(calc.compute(team.common.count.withSpecialty('stun')).val).toEqual(1)
    expect(
      calc.compute(team.common.count.withSpecialty('anomaly')).val
    ).toEqual(0)
    expect(
      calc.compute(team.common.count.withFaction('CunningHares')).val
    ).toEqual(1)
    expect(
      calc.compute(team.common.count.withFaction('BelebogHeavyIndustries')).val
    ).toEqual(1)
    expect(
      calc.compute(team.common.count.withFaction('StarsOfLyra')).val
    ).toEqual(0)
  })
})

describe('tag leak test', () => {
  it('reproduce name leaking into qt:char read', () => {
    const teams = teamData(['Anton'])
    const data: TagMapNodeEntries = [
      ...teams,
      ...withMember(
        'Anton',
        ...charTagMapNodeEntries({
          level: 60,
          promotion: 5,
          key: 'Anton',
          mindscape: 4,
          potential: 0,
          basic: 6,
          dodge: 6,
          special: 6,
          assist: 6,
          chain: 6,
          core: 6,
        }),
        ...wengineTagMapNodeEntries({
          key: 'VortexRevolver',
          level: 60,
          modification: 5,
          phase: 1,
        }),
        ownBuff.initial.atk.add(25),
        ownBuff.combat.atk.add(100),
        ownBuff.combat.atk_.add(0.08),
        ownBuff.initial.crit_.add(0.7),
        ownBuff.initial.crit_dmg_.add(1.04),
        ownBuff.initial.dmg_.electric.add(0.4),
        ownBuff.initial.anomProf.add(338)
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
      enemy.common.res_.electric.add(0.1),
      enemyDebuff.common.stun_.add(1.5),
      enemyDebuff.common.unstun_.add(1),
    ]
    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, data)
    ).withTag({ src: 'Anton', dst: 'Anton', preset: 'preset0' })

    // Try to access a buff that has a name, and also reads own.char.mindscape
    // m4_crit_ buff entry: registered at {..., name:'m4_crit_', et:'teamBuff', ...}
    // Its formula value includes cmpGE(char.mindscape, 4, ...)
    // When evaluating this formula, name:'m4_crit_' should leak into qt:char reads

    const m4Tag = reader.withTag({
      name: 'm4_crit_',
      et: 'display',
      qt: 'combat' as any,
      q: 'crit_',
    }).tag

    // Compute the m4_crit_ buff display entry — this is at sheet:'Anton' so we need to include sheet
    // The value is cmpGE(char.mindscape, 4, chain_ult_used.ifOn(...))
    // This should trigger char.mindscape read with name:'m4_crit_' leaked from context
    expect(() => {
      const result = calc.compute(read({ ...m4Tag, sheet: 'Anton' }))
      console.log('m4_crit_ display formula result:', result.val)
    }).not.toThrow()
  })
})

describe('sheet', () => {
  test('buff entries', () => {
    const sheets = new Set([
      ...allCharacterKeys,
      'wengine',
      ...allWengineKeys,
      'disc',
      ...allDiscSetKeys,
      'anomaly',
    ])
    for (const { tag } of data) {
      if (tag.et && tag.qt && tag.q) {
        switch (tag.et) {
          case 'notOwnBuff':
          case 'teamBuff': {
            const { sheet } = (ownTag as any)[tag.qt][tag.q]
            // Buff entries are for agg queries inside a sheet
            if (sheet === 'agg' && sheets.has(tag.sheet as any)) continue
            fail(`Ill-form entry (${tagStr(tag)}) for sheet ${sheet}`)
          }
          // eslint-disable-next-line no-fallthrough
          case 'enemyDeBuff': {
            const { sheet } = (enemyTag as any)[tag.qt][tag.q]
            if (sheet === 'agg' && sheets.has(tag.sheet as any)) continue
            if (sheet === tag.sheet) continue
            fail(`Ill-form entry (${tagStr(tag)}) for sheet ${sheet}`)
          }
          // eslint-disable-next-line no-fallthrough
          case 'own': {
            const desc = (ownTag as any)[tag.qt]?.[tag.q]
            if (!desc) continue
            const { sheet } = desc
            if (!sheet) continue
            if (sheet === 'iso' || sheet === 'agg' || sheet === tag.sheet)
              continue
            fail(`Illform entry (${tagStr(tag)}) for sheet ${sheet}`)
          }
          // eslint-disable-next-line no-fallthrough
          case 'enemy': {
            const desc = (enemyTag as any)[tag.qt]?.[tag.q]
            if (!desc) continue
            const { sheet } = desc
            if (!sheet) continue
            if (sheet === 'agg' || sheet === tag.sheet) continue
            fail(`Illform entry (${tagStr(tag)}) for sheet ${sheet}`)
          }
        }
      }
    }
  })
})
