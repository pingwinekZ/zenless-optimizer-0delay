import type { IFormulaData } from '@zenless-optimizer/game-opt/engine'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import { Lucy, Nicole, Pyrois, Vivian } from '@zenless-optimizer/zzz/formula'
import LucySheet from './sheets/Lucy'
import NicoleSheet from './sheets/Nicole'
import PyroisSheet from './sheets/Pyrois'
import VivianSheet from './sheets/Vivian'
import { condSection, fieldsSection } from './sheetUtil'

const fakeBuff = (name: string) =>
  ({ tag: { name } }) as unknown as IFormulaData<Tag>

type AnyDoc = any
function docsOf(sheet: object, slot: string): AnyDoc[] {
  const el = (sheet as any)[slot]
  expect(el).toBeDefined()
  return el.documents as AnyDoc[]
}
function allDocs(sheet: object): AnyDoc[] {
  return Object.values(sheet as object).flatMap(
    (el: any) => (el?.documents ?? []) as AnyDoc[]
  )
}

describe('condSection', () => {
  it('wires metadata, label, description and buff fields', () => {
    const metadata = { name: 'c' }
    const b1 = fakeBuff('b1')
    const b2 = fakeBuff('b2')
    const doc = condSection(metadata as never, [b1, b2], {
      label: 'L',
      description: 'D',
    }) as AnyDoc
    expect(doc.type).toBe('conditional')
    expect(doc.conditional.metadata).toBe(metadata)
    expect(doc.conditional.label).toBe('L')
    expect(doc.conditional.description).toBe('D')
    expect(doc.conditional.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      b1.tag,
      b2.tag,
    ])
  })
  it('passes through linked and omits description when absent', () => {
    const doc = condSection({ name: 'c' } as never, [], {
      label: 'L',
      linked: ['other'],
    }) as AnyDoc
    expect(doc.conditional.linked).toEqual(['other'])
    expect('description' in doc.conditional).toBe(false)
  })
})

describe('fieldsSection', () => {
  it('builds the standard header and buff fields', () => {
    const b = fakeBuff('b')
    const doc = fieldsSection('T', [b]) as AnyDoc
    expect(doc.type).toBe('fields')
    expect(doc.header).toEqual({ icon: null, text: 'T' })
    expect(doc.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([b.tag])
    expect('description' in doc).toBe(false)
  })
  it('appends extraFields after buff fields with description', () => {
    const b = fakeBuff('b')
    const extra = { title: 'X', fieldRef: { name: 'x' } }
    const doc = fieldsSection('T', [b], {
      description: 'D',
      extraFields: [extra] as never,
    }) as AnyDoc
    expect(doc.description).toBe('D')
    expect(doc.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      b.tag,
      extra.fieldRef,
    ])
  })
})

describe('migrated sheets keep their shape', () => {
  it('Pyrois: core conditional + ability/m1 fields', () => {
    // `ability` addl docs merge into the `core` element (createBaseSheet)
    const coreDocs = docsOf(PyroisSheet, 'core')
    const conds = coreDocs.filter((d) => d.type === 'conditional')
    expect(conds).toHaveLength(1)
    expect(conds[0].conditional.metadata).toBe(Pyrois.conditionals.sunflare)
    expect(conds[0].conditional.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Pyrois.buffs.sunflare_enerRegen_.tag,
      Pyrois.buffs.sunflare_common_dmg_.tag,
    ])
    const coreFields = coreDocs.filter((d) => d.type === 'fields')
    expect(coreFields).toHaveLength(1)
    expect(coreFields[0].fields).toHaveLength(1)
    expect(coreFields[0].fields[0].fieldRef).toBe(
      Pyrois.buffs.ability_crit_dmg_.tag
    )
    const m1Fields = docsOf(PyroisSheet, 'm1').filter(
      (d) => d.type === 'fields'
    )
    expect(m1Fields).toHaveLength(1)
    expect(m1Fields[0].fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Pyrois.buffs.m1_crit_.tag,
    ])
  })
  it('Nicole: linked conditionals + mixed m1 fields', () => {
    const core = docsOf(NicoleSheet, 'core').find(
      (d) => d.type === 'conditional'
    )
    expect(core.conditional.metadata).toBe(
      Nicole.conditionals.bulletsOrFieldHit
    )
    expect(core.conditional.linked).toEqual(['bulletsOrFieldHit_ability'])
    const m1 = docsOf(NicoleSheet, 'm1').find((d) => d.type === 'fields')
    expect(m1.description).toBeDefined()
    expect(m1.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Nicole.buffs.m1_exSpecial_dmg_.tag,
      Nicole.buffs.m1_exSpecial_anomBuildup_.tag,
    ])
  })
  it('Vivian: sliced descriptions on core/ability/mindscape docs', () => {
    // `ability` addl docs merge into the `core` element (createBaseSheet),
    // so core fields are: Abloom, Prophecy, then the ability field.
    const coreFields = docsOf(VivianSheet, 'core').filter(
      (d) => d.type === 'fields'
    )
    expect(coreFields).toHaveLength(3)
    expect(coreFields[0].description).toBeDefined()
    expect(coreFields[0].fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Vivian.buffs.core_ether_anom_mv_mult_.tag,
      Vivian.buffs.core_electric_anom_mv_mult_.tag,
      Vivian.buffs.core_fire_anom_mv_mult_.tag,
      Vivian.buffs.core_physical_anom_mv_mult_.tag,
      Vivian.buffs.core_ice_anom_mv_mult_.tag,
      Vivian.buffs.core_wind_anom_mv_mult_.tag,
    ])
    expect(coreFields[1].description).toBeDefined()
    expect(coreFields[2].description).toBeDefined()
    expect(coreFields[2].fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Vivian.buffs.ability_corruption_dmg_.tag,
      Vivian.buffs.ability_corruption_disorder_dmg_.tag,
    ])
    const m1 = docsOf(VivianSheet, 'm1').find((d) => d.type === 'conditional')
    expect(m1.conditional.metadata).toBe(Vivian.conditionals.prophecy)
    expect(m1.conditional.description).toBeDefined()
    // M2 Ether Anomaly Buildup is its own passive block, separate from RES Ign.
    const m2Fields = docsOf(VivianSheet, 'm2').filter(
      (d) => d.type === 'fields'
    )
    expect(m2Fields).toHaveLength(2)
    expect(m2Fields[0].fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Vivian.buffs.m2_ether_anomBuildup_.tag,
    ])
    expect(m2Fields[1].fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Vivian.buffs.m2_resIgn_.tag,
    ])
    for (const slot of ['m4', 'm6']) {
      const fieldsDoc = docsOf(VivianSheet, slot).find(
        (d) => d.type === 'fields'
      )
      expect(fieldsDoc.description).toBeDefined()
    }
  })
  it('Lucy: per-skill conditional + m4 link + m6 formula field', () => {
    const cheerOn = allDocs(LucySheet).find(
      (d) =>
        d.type === 'conditional' &&
        d.conditional.metadata === Lucy.conditionals.cheerOn
    )
    expect(cheerOn).toBeDefined()
    expect(cheerOn.conditional.linked).toEqual(['cheerOn_m4'])
    const m4 = docsOf(LucySheet, 'm4').find((d) => d.type === 'conditional')
    expect(m4.conditional.linked).toEqual(['cheerOn'])
    const m6 = docsOf(LucySheet, 'm6').find((d) => d.type === 'fields')
    expect(m6.description).toBeDefined()
    expect(m6.fields.map((f: AnyDoc) => f.fieldRef)).toEqual([
      Lucy.formulas.m6_dmg.tag,
    ])
  })
})
