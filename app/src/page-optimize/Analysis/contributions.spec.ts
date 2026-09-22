import type { ICachedCharacter, Team } from '@zenless-optimizer/zzz/db'
import {
  type ContributionTarget,
  convert,
  explainContributions,
  explainContributionsAsync,
  ownTag,
  zzzCalculatorWithEntries,
} from '@zenless-optimizer/zzz/formula'
import { buildCalculatorEntries } from '@zenless-optimizer/zzz/solver/buildStatsUtils'

function mockCharacter(key: ICachedCharacter['key']): ICachedCharacter {
  return {
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
    wengineKey: '',
    wenginePhase: 1,
    equippedDiscs: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  } as unknown as ICachedCharacter
}

function teamWith(opts: {
  cheerOn?: number
  bonusStats?: any[]
  enemyStats?: any[]
}): Team {
  const { cheerOn = 0, bonusStats = [], enemyStats = [] } = opts
  return {
    teammates: [{ characterKey: 'Anby' }, { characterKey: 'Lucy' }],
    frames: [
      {
        tag: undefined,
        multiplier: 1,
        critMode: 'avg',
        bonusStats,
        conditionals: [
          {
            sheet: 'Lucy',
            src: 'Lucy',
            dst: null,
            condKey: 'cheerOn',
            condValue: cheerOn,
          },
        ],
        enemyStats,
      },
    ],
    enemyLvl: 80,
    enemyDef: 953,
    enemyStunMultiplier: 150,
  } as unknown as Team
}

function atkTarget(preset: string): ContributionTarget {
  const reader = convert(ownTag, {
    et: 'own',
    src: 'Anby',
    preset: preset as any,
  })
  return { read: reader.final.atk as any, multiplier: 1 }
}

function explain(
  team: Team,
  targetSets: ContributionTarget[][],
  character = mockCharacter('Anby')
) {
  const entries = buildCalculatorEntries(character, {}, team)
  return {
    entries,
    sources: explainContributions(entries, character.key, targetSets, (e) =>
      zzzCalculatorWithEntries(e)
    ),
  }
}

describe('contribution attribution (Phase 1)', () => {
  it('attributes teammate teamBuff to its own sheet, sums preserved', () => {
    const off = explain(teamWith({}), [[atkTarget('preset0')]])
    const on = explain(teamWith({ cheerOn: 1 }), [[atkTarget('preset0')]])
    const [offSources] = off.sources
    const [onSources] = on.sources
    expect(offSources).toEqual([])

    // cheerOn=1 raises Anby ATK by ~227.44 (see probe5); the whole delta
    // must be attributed to Lucy's sheet — not grouped into Anby.
    expect(onSources).toHaveLength(1)
    expect(onSources![0]!.key).toBe('sheet:Lucy')
    expect(onSources![0]!.label).toBe('Lucy')

    const calcOff = zzzCalculatorWithEntries(off.entries)
    const calcOn = zzzCalculatorWithEntries(on.entries)
    const atkOff = calcOff.compute(atkTarget('preset0').read as any).val
    const atkOn = calcOn.compute(atkTarget('preset0').read as any).val
    expect(atkOn - (atkOff as number)).toBeCloseTo(227.44, 1)
    expect(onSources![0]!.value).toBeCloseTo(
      (atkOn as number) - (atkOff as number),
      6
    )
  })

  it('attributes frame bonus stats to the custom source', () => {
    const { sources } = explain(
      teamWith({
        bonusStats: [{ tag: { q: 'atk', qt: 'combat' }, value: 50 }],
      }),
      [[atkTarget('preset0')]]
    )
    const [actionSources] = sources
    expect(actionSources).toHaveLength(1)
    expect(actionSources![0]!.key).toBe('custom')
    expect(actionSources![0]!.value).toBeCloseTo(50, 6)
  })

  it('async variant attributes exactly like the sync one', async () => {
    const targets = [[atkTarget('preset0')]]
    const { entries, sources } = explain(teamWith({ cheerOn: 1 }), targets)
    const asyncSources = await explainContributionsAsync(
      entries,
      'Anby',
      targets,
      (e) => zzzCalculatorWithEntries(e)
    )
    expect(asyncSources).not.toBeNull()
    expect(asyncSources).toEqual(sources)
  })

  it('async variant abandons the run when the caller cancels', async () => {
    const targets = [[atkTarget('preset0')]]
    const { entries } = explain(teamWith({ cheerOn: 1 }), targets)
    const cancelled = await explainContributionsAsync(
      entries,
      'Anby',
      targets,
      (e) => zzzCalculatorWithEntries(e),
      { shouldCancel: () => true }
    )
    expect(cancelled).toBeNull()
  })

  it('only shows buffs targeting the opt target preset', () => {
    // bonusStats live on preset0: the preset0 read sees +50, preset1 is clean.
    const { sources } = explain(
      teamWith({
        bonusStats: [{ tag: { q: 'atk', qt: 'combat' }, value: 50 }],
      }),
      [[atkTarget('preset0')], [atkTarget('preset1')]]
    )
    const [p0, p1] = sources
    expect(p0!.map((s) => s.key)).toEqual(['custom'])
    expect(p1).toEqual([])
  })
})
