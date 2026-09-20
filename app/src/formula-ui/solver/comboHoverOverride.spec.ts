import { createTestDBStorage } from '@zenless-optimizer/common/database'
import { correctConditionalValue } from '@zenless-optimizer/game-opt/engine'
import { read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey, DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type {
  ICachedCharacter,
  ICachedDisc,
  Team,
} from '@zenless-optimizer/zzz/db'
import { ZzzDatabase } from '@zenless-optimizer/zzz/db/Database/Database'
import {
  getConditional,
  zzzCalculatorWithEntries,
} from '@zenless-optimizer/zzz/formula'
import { buildCalculatorEntries } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import yeDiscs from '@zenless-optimizer/zzz/solver/ye-shunguang-entry-rotation-discs.json'
import { charSheets } from '..'

const YE = 'YeShunguang' as CharacterKey

function mockCharacter(
  key: CharacterKey,
  wengineKey = '',
  mindscape = 0
): ICachedCharacter {
  return {
    key,
    level: 60,
    promotion: 6,
    basic: 10,
    dodge: 9,
    special: 10,
    chain: 10,
    assist: 10,
    core: 6,
    mindscape,
    wengineKey,
    wenginePhase: 5,
    equippedDiscs: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  } as unknown as ICachedCharacter
}

/**
 * Backs the advanced-rotation hover buff values (`useCondOverrideCalc`):
 * gating a teammate conditional that backfill never adds to frame0 must
 * still move the buff (append-if-missing), with num values scaling.
 */
describe('combo hover override calc', () => {
  it('computes buff values with the row gate overridden', () => {
    const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
    for (const disc of yeDiscs.discs) {
      const { id, ...data } = disc
      database.discs.set(id, { ...data, id } as never)
    }
    database.teams.set(YE, {
      teammates: [
        { characterKey: YE },
        { characterKey: 'Sunna' as CharacterKey },
        { characterKey: 'Zhao' as CharacterKey },
      ],
      frames: [
        {
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    } as never)
    const team = database.teams.get(YE)!
    const character = mockCharacter(YE, 'CloudcleaveRadiance')
    const discs = Object.fromEntries(
      yeDiscs.discs.map((d) => [
        d.slotKey,
        database.discs.get(d.id) ?? undefined,
      ])
    ) as Record<DiscSlotKey, ICachedDisc | undefined>
    const getTeammateChar = (key: CharacterKey) =>
      key === 'Sunna'
        ? mockCharacter(key, 'Thoughtbop', 6)
        : key === 'Zhao'
          ? mockCharacter(key, 'HalfSugarBunny')
          : undefined
    const getDisc = (id: string) => database.discs.get(id) ?? undefined
    const build = (t: Team) =>
      zzzCalculatorWithEntries(
        buildCalculatorEntries(character, discs, t, getTeammateChar, getDisc)
      )
    const ambient = build(team)
    const withGate = (sheet: string, condKey: string, value: number) => {
      const meta = getConditional(sheet as never, condKey) as any
      const eff = correctConditionalValue(meta, value)
      return build({
        ...team,
        frames: team.frames.map((f, i) =>
          i === 0
            ? {
                ...f,
                conditionals: f.conditionals.some(
                  (c) =>
                    c.sheet === sheet &&
                    c.condKey === condKey &&
                    c.src === 'Sunna'
                )
                  ? f.conditionals.map((c) =>
                      c.sheet === sheet &&
                      c.condKey === condKey &&
                      c.src === 'Sunna'
                        ? { ...c, condValue: eff }
                        : c
                    )
                  : [
                      ...f.conditionals,
                      {
                        sheet,
                        src: 'Sunna',
                        dst: null,
                        condKey,
                        condValue: eff,
                      } as never,
                    ],
              }
            : f
        ),
      })
    }
    // m1 stacks scaling: first field of the m1DefReductionStacks doc.
    let stackRef: any = null
    for (const section of Object.values(charSheets['Sunna'] ?? {})) {
      for (const doc of (section as any).documents ?? []) {
        if (doc?.conditional?.metadata?.name !== 'm1DefReductionStacks')
          continue
        stackRef = (doc.conditional.fields ?? []).find(
          (f: any) => 'fieldRef' in f
        )?.fieldRef
      }
    }
    if (stackRef) {
      const tag = { src: 'Sunna', dst: 'YeShunguang', preset: 'preset0' }
      const amb = ambient.withTag(tag as never).compute(read(stackRef)).val
      const at1 = withGate('Sunna', 'm1DefReductionStacks', 1)
        .withTag(tag as never)
        .compute(read(stackRef)).val
      const at2 = withGate('Sunna', 'm1DefReductionStacks', 2)
        .withTag(tag as never)
        .compute(read(stackRef)).val
      const at3 = withGate('Sunna', 'm1DefReductionStacks', 3)
        .withTag(tag as never)
        .compute(read(stackRef)).val
      // 7% DEF RED per stack when gated on (M1 Sunna in this fixture).
      expect(amb).toBe(0)
      expect(at1).toBeCloseTo(0.07, 10)
      expect(at2).toBeCloseTo(0.14, 10)
      expect(at3).toBeCloseTo(0.21, 10)
    }
    // Bool gate: m2 etherVeil ATK buff (10%) appears when forced on.
    let veilRef: any = null
    for (const section of Object.values(charSheets['Sunna'] ?? {})) {
      for (const doc of (section as any).documents ?? []) {
        if (doc?.conditional?.metadata?.name !== 'etherVeil') continue
        veilRef = (doc.conditional.fields ?? []).find(
          (f: any) => 'fieldRef' in f
        )?.fieldRef
      }
    }
    if (veilRef) {
      const tag = { src: 'Sunna', dst: 'YeShunguang', preset: 'preset0' }
      const amb = ambient.withTag(tag as never).compute(read(veilRef)).val
      const on = withGate('Sunna', 'etherVeil', 1)
        .withTag(tag as never)
        .compute(read(veilRef)).val
      expect(amb).toBe(0)
      expect(on).toBeCloseTo(0.1, 10)
    }
  })
})
