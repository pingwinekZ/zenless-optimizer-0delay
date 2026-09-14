import { createTestDBStorage } from '@zenless-optimizer/common/database'
import { read } from '@zenless-optimizer/pando/engine'
import yeDiscs from '../../../ye-shunguang-entry-rotation-discs.json'
import type { CharacterKey, DiscSlotKey } from '../consts'
import type { ICachedCharacter, ICachedDisc, Team } from '../db'
import { comboCondHash } from '../db'
import { ZzzDatabase } from '../db/Database/Database'
import { zzzCalculatorWithEntries } from '../formula'
import { wengineUiSheets } from '../formula-ui'
import { buildCalculatorEntries } from '../page-optimize/Util/buildStatsUtils'

const YE = 'YeShunguang' as CharacterKey
const SUNNA = 'Sunna' as CharacterKey

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

function thoughtbopDmgRef(): any {
  const docs = (wengineUiSheets['Thoughtbop'] as any)?.documents ?? []
  for (const doc of docs) {
    if (doc?.conditional?.metadata?.name !== 'physExSpecialUsed') continue
    return (doc.conditional.fields ?? []).find((f: any) => 'fieldRef' in f)
      ?.fieldRef
  }
  return null
}

/**
 * Totem for the teammate-card hover fix: with an advanced rotation where
 * frame0 (control) is 2 but hit 0's blob override is 1, the ambient page
 * calc (preset0) reads the per-hit value while a frame0 hover calc
 * (blob stripped) must read the control's value.
 */
describe('frame0 hover calc', () => {
  it('reads frame0 default instead of hit0 blob override', () => {
    const dmgRef = thoughtbopDmgRef()
    expect(dmgRef).toBeTruthy()

    const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
    for (const disc of yeDiscs.discs) {
      const { id, ...data } = disc
      database.discs.set(id, { ...data, id } as never)
    }
    const rotation = [
      { sheet: YE, name: 'BasicAttackEnlightenedMindSunderlight_0_dmg' },
      { sheet: YE, name: 'BasicAttackEnlightenedMindSunderlight_1_dmg' },
    ]
    const hash = comboCondHash('Thoughtbop', 'physExSpecialUsed', SUNNA, null)
    database.teams.set(YE, {
      teammates: [
        { characterKey: YE },
        { characterKey: SUNNA },
        { characterKey: 'Zhao' as CharacterKey },
      ],
      frames: [
        {
          tag: {
            rotation,
            comboType: 'advanced',
            comboStateJson: JSON.stringify({
              version: '1.0',
              values: { [hash]: [1, 1] },
            }),
          },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [
            {
              sheet: 'Thoughtbop',
              src: SUNNA,
              dst: null,
              condKey: 'physExSpecialUsed',
              condValue: 2,
            },
          ],
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
      key === SUNNA
        ? mockCharacter(key, 'Thoughtbop', 6)
        : key === ('Zhao' as CharacterKey)
          ? mockCharacter(key, 'HalfSugarBunny')
          : undefined
    const getDisc = (id: string) => database.discs.get(id) ?? undefined
    const build = (t: Team) =>
      zzzCalculatorWithEntries(
        buildCalculatorEntries(character, discs, t, getTeammateChar, getDisc)
      )

    const tag = { src: SUNNA, dst: YE, preset: 'preset0' }
    const ambient = build(team)
      .withTag(tag as never)
      .compute(read(dmgRef)).val

    // Frame0 hover calc: same team but with per-hit overrides stripped,
    // forcing the hovered row to the control's frame0 value (2).
    const frame0 = team.frames[0]!
    const stripped: Team = {
      ...team,
      frames: team.frames.map((f, i) =>
        i === 0
          ? {
              ...f,
              tag: f.tag?.comboStateJson
                ? { ...f.tag, comboStateJson: undefined }
                : f.tag,
            }
          : f
      ),
    }
    const hovered = build(stripped)
      .withTag(tag as never)
      .compute(read(dmgRef)).val

    // Reference: frame0=2 with no blob at all must equal the hovered value,
    // and differ from the hit0=1 ambient value (per-stack scaling).
    const noBlob: Team = {
      ...team,
      frames: team.frames.map((f, i) =>
        i === 0
          ? {
              ...f,
              tag: { rotation: f.tag?.rotation } as never,
            }
          : f
      ),
    }
    void frame0
    const atFrame0 = build(noBlob)
      .withTag(tag as never)
      .compute(read(dmgRef)).val

    expect(hovered).toBeCloseTo(atFrame0, 10)
    expect(ambient).toBeCloseTo(atFrame0 / 2, 10)
    expect(hovered).not.toBeCloseTo(ambient, 5)
  })
})
