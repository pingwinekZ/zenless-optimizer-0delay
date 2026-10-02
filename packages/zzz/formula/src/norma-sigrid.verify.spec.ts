import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats } from '@zenless-optimizer/zzz/stats'
// Temporary verification for Norma's squad gate with Sigrid. Deleted after use.
import { describe, expect, it } from 'vitest'
import { charTagMapNodeEntries, teamData, withMember } from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, own, ownBuff, team } from './data/util'

function memberEntries(key: CharacterKey): TagMapNodeEntries {
  return withMember(
    key,
    ...charTagMapNodeEntries({
      key,
      level: 60,
      promotion: 5,
      basic: 11,
      dodge: 11,
      special: 11,
      chain: 11,
      assist: 11,
      core: 6,
      mindscape: 0,
    }),
    // Production count entries (CharCalcProvider.memberAndEquipmentEntries)
    ownBuff.common.count.withSpecialty(allStats.char[key].specialty).add(1),
    ownBuff.common.count.withFaction(allStats.char[key].faction).add(1)
  )
}

function setupCalc(members: readonly CharacterKey[]): Calculator {
  const data: TagMapNodeEntries = [
    ...teamData(members),
    ...members.flatMap((m) => memberEntries(m)),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    conditionalEntries('Norma', 'Norma', null)('tech_divide_stacks', 3),
    conditionalEntries('Norma', 'Norma', null)('enNahBarrage_atk', 1),
    conditionalEntries('Norma', 'Norma', null)('enNahBarrage_dmg', 1),
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, data))
}

function readTag(calc: Calculator, tag: object): number {
  return calc.compute(read(tag)).val as number
}

describe('Norma squad gate with Sigrid (scratch)', () => {
  it('counts Sigrid as attack + Roscaelifer', () => {
    const calc = setupCalc(['Norma', 'Sigrid'])
    console.log(
      'attack =',
      readTag(calc, team.common.count.withSpecialty('attack').tag)
    )
    console.log(
      'rupture =',
      readTag(calc, team.common.count.withSpecialty('rupture').tag)
    )
    console.log(
      'rosca =',
      readTag(calc, team.common.count.withFaction('Roscaelifer').tag)
    )
  })
  it('ability stun applies with Sigrid, not without', () => {
    const on = setupCalc(['Norma', 'Sigrid', 'Nicole'])
    const off = setupCalc(['Norma', 'Nicole', 'Anby'])
    console.log(
      'rosca control =',
      readTag(off, team.common.count.withFaction('Roscaelifer').tag),
      'attack control =',
      readTag(off, team.common.count.withSpecialty('attack').tag)
    )
    const stunOn = readTag(on, enemy.common.stun_.tag)
    const stunOff = readTag(off, enemy.common.stun_.tag)
    console.log('stun_ with Sigrid =', stunOn, '| without =', stunOff)
    expect(stunOn).toBeGreaterThan(0)
    expect(stunOff).toBeCloseTo(0, 6)
  })
})
