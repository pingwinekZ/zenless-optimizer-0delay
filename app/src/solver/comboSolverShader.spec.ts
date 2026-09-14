import { createTestDBStorage } from '@zenless-optimizer/common/database'
import {
  compileWgsl,
  generateWgsl,
} from '@zenless-optimizer/game-opt/solver-webgpu'
import * as fs from 'fs'
import yeDiscs from '../../../ye-shunguang-entry-rotation-discs.json'
import type { CharacterKey, DiscSlotKey, PhaseKey } from '../consts'
import { allCharacterKeys } from '../consts'
import type { ICachedCharacter, ICachedDisc } from '../db'
import { getComboFrames, targetTag } from '../db'
import { ZzzDatabase } from '../db/Database/Database'
import { zzzCalculatorWithEntries } from '../formula'
import { buildCalculatorEntries } from '../page-optimize/Util/buildStatsUtils'
import { createSolverConfig } from './index'

const YE = 'YeShunguang' as CharacterKey

const ROTATION = [
  'EntrySkillIlluminatingDarkness_0_dmg',
  'BasicAttackEnlightenedMindSunderlight_0_dmg',
  'BasicAttackEnlightenedMindSunderlight_1_dmg',
  'BasicAttackEnlightenedMindSunderlightAnnihilation_1_dmg',
  'BasicAttackEnlightenedMindSunderlightMaximum_0_dmg',
  'EXSpecialAttackEnlightenedMindSoaringLight_0_dmg',
  'BasicAttackEnlightenedMindSkywardAscent_0_dmg',
  'BasicAttackEnlightenedMindSunderlight_0_dmg',
  'BasicAttackEnlightenedMindSunderlight_1_dmg',
  'BasicAttackEnlightenedMindSunderlightAnnihilation_1_dmg',
  'BasicAttackEnlightenedMindSunderlightMaximum_0_dmg',
  'EXSpecialAttackEnlightenedMindSoaringLight_0_dmg',
  'BasicAttackEnlightenedMindSkywardAscent_0_dmg',
  'EXSpecialAttackEnlightenedMindReturnToDust_0_dmg',
]

function mockCharacter(key: CharacterKey, wengineKey = ''): ICachedCharacter {
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
    mindscape: 0,
    wengineKey,
    wenginePhase: 5,
    equippedDiscs: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  } as unknown as ICachedCharacter
}

describe('combo solver shader (Ye Shunguang 14-hit rotation)', () => {
  it('generates valid WGSL for the app solver config', () => {
    const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
    for (const disc of yeDiscs.discs) {
      const { id, ...data } = disc
      database.discs.set(id, { ...data, id } as never)
    }
    database.teams.set(YE, {
      teammates: [
        { characterKey: YE },
        {
          characterKey: 'Sunna' as CharacterKey,
          discSet4Key: 'MoonlightLullaby',
        },
        {
          characterKey: 'Zhao' as CharacterKey,
          discSet4Key: 'BunnyInWonderland',
        },
      ],
      frames: [
        {
          tag: {
            rotation: ROTATION.map((name) => ({ sheet: YE, name })),
          },
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
    // All 14 hits must survive validation (catches formula name typos).
    expect(team.frames[0]?.tag?.rotation).toHaveLength(14)

    const character = mockCharacter(YE, 'CloudcleaveRadiance')
    const discs = Object.fromEntries(
      yeDiscs.discs.map((d) => [
        d.slotKey,
        database.discs.get(d.id) ?? undefined,
      ])
    ) as Record<DiscSlotKey, ICachedDisc | undefined>
    expect(Object.values(discs).filter(Boolean)).toHaveLength(6)

    const getTeammateChar = (key: CharacterKey) =>
      key === 'Sunna'
        ? mockCharacter(key, 'Thoughtbop')
        : key === 'Zhao'
          ? mockCharacter(key, 'HalfSugarBunny')
          : undefined
    const entries = buildCalculatorEntries(
      character,
      discs,
      team,
      getTeammateChar,
      (id) => database.discs.get(id) ?? undefined
    )
    const calc = zzzCalculatorWithEntries(entries)

    const frames = getComboFrames(team).map((f) => ({
      tag: targetTag(f.tag!),
      multiplier: f.multiplier ?? 1,
    }))
    expect(frames).toHaveLength(14)

    const discsBySlot = Object.fromEntries(
      Object.entries(discs).map(([slot, disc]) => [slot, disc ? [disc] : []])
    ) as Record<DiscSlotKey, ICachedDisc[]>
    const config = createSolverConfig(
      YE,
      calc,
      frames,
      [],
      [],
      [],
      ['CloudcleaveRadiance'] as never,
      5 as PhaseKey,
      discsBySlot,
      4,
      5,
      () => {}
    )
    const { nodes, minimum, candidates } = config

    // Mirror optimize() in webgpuOptimizer.ts
    const order = candidates
      .map((_, i) => i)
      .sort((a, b) => candidates[b].length - candidates[a].length)
    const orderedCandidates = order.map((i) => candidates[i])
    const sizes = orderedCandidates.map((c) => c.length)
    const keySet = new Set<string>()
    for (const slot of orderedCandidates)
      for (const cnd of slot) for (const k in cnd) if (k !== 'id') keySet.add(k)
    const coordKeys = [...keySet]
    const slotCoordKeys = orderedCandidates.map((slot) => {
      const keys = new Set<string>()
      for (const cnd of slot) for (const k in cnd) if (k !== 'id') keys.add(k)
      return [...keys]
    })
    const generated = compileWgsl(nodes, {
      dynTagCat: 'q',
      slotCount: sizes.length,
      coordKeys,
      f16: false,
      slotCoordKeys,
    })
    const wgsl = generateWgsl({
      slotCount: sizes.length,
      slotSizes: sizes,
      minimum,
      nodes,
      generated,
      compactLimit: 4096,
      workgroupSize: 256,
      cyclesPerInvocation: 256,
      f16: false,
    } as never)

    fs.mkdirSync('/tmp/opencode', { recursive: true })
    fs.writeFileSync('/tmp/opencode/repro.wgsl', wgsl)
    console.log('WGSL bytes:', wgsl.length, 'nodes:', nodes.length)

    expect(wgsl).not.toMatch(/\bundefined\b/)
    expect(wgsl).not.toMatch(/\bNaN\b/)
    expect(wgsl).not.toMatch(/\bInfinity\b/)
    const opens = (wgsl.match(/\{/g) ?? []).length
    const closes = (wgsl.match(/\}/g) ?? []).length
    expect(opens).toBe(closes)
    expect(allCharacterKeys.length).toBeGreaterThan(0)
  })
})
