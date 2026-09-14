import { allCharacterKeys } from '../../consts'
import type { TeamConditional } from '../../db'
import { conditionals as allConditionalsMeta } from '../../formula'
import {
  type ComboMember,
  filterRelevantConditionals,
  isTeammateConditionalTeamwide,
  synthesizeTeammateConditionals,
} from './useComboMembers'

const mainKey = allCharacterKeys[0]

function entry(
  sheet: string,
  condKey: string,
  src: string,
  condValue: number
): TeamConditional {
  return {
    sheet: sheet as never,
    src: src as never,
    dst: null as never,
    condKey,
    condValue,
  }
}

function members(): ComboMember[] {
  return [
    {
      key: mainKey,
      mindscape: 0,
      wengineKey: '',
      wenginePhase: 1,
      discSets: {},
    },
    {
      key: 'Lucy' as never,
      mindscape: 0,
      wengineKey: '',
      wenginePhase: 1,
      discSets: {},
    },
  ]
}

describe('filterRelevantConditionals', () => {
  it('drops backfilled entries for unrelated sheets', () => {
    const conds = [
      entry(mainKey, 'k', mainKey, 1),
      entry('Lucy', 'cheerOn', 'Lucy', 1),
      // Backfill noise: Lucy sheet under main src, and a random stranger.
      entry('Lucy', 'cheerOn', mainKey, 1),
      entry('SomeStranger', 'whatever', mainKey, 1),
    ]
    const result = filterRelevantConditionals(conds, members())
    expect(result.map((c) => `${c.sheet}:${c.src}`)).toEqual([
      `${mainKey}:${mainKey}`,
      'Lucy:Lucy',
    ])
  })
})

describe('isTeammateConditionalTeamwide', () => {
  it('hides self-only teammate buffs but keeps teamwide ones', () => {
    // Sunna M6 Focused Creation is self CR/CD — hidden in teammate view.
    expect(isTeammateConditionalTeamwide('Sunna', 'focusedCreation')).toBe(
      false
    )
    // Sunna M1 DEF reduction reaches the enemy — affects main combo damage.
    expect(isTeammateConditionalTeamwide('Sunna', 'm1DefReductionStacks')).toBe(
      true
    )
    // Thoughtbop stacks grant squad DMG/ATK — teamwide.
    expect(
      isTeammateConditionalTeamwide('Thoughtbop', 'physExSpecialUsed')
    ).toBe(true)
    // BlazingLaurel assist Impact is self-only; its Wilt CRIT DMG is squad-wide.
    expect(
      isTeammateConditionalTeamwide('BlazingLaurel', 'quickOrPerfectAssistUsed')
    ).toBe(false)
    expect(isTeammateConditionalTeamwide('BlazingLaurel', 'wilt')).toBe(true)
    // Lucy Cheer On grants squad ATK — teamwide.
    expect(isTeammateConditionalTeamwide('Lucy', 'cheerOn')).toBe(true)
  })
})

describe('filterRelevantConditionals teammate teamwide', () => {
  function sunnaMembers(): ComboMember[] {
    return [
      {
        key: mainKey,
        mindscape: 0,
        wengineKey: '',
        wenginePhase: 1,
        discSets: {},
      },
      {
        key: 'Sunna' as never,
        mindscape: 6,
        wengineKey: 'BlazingLaurel',
        wenginePhase: 1,
        discSets: {},
      },
    ]
  }
  it('drops self-only teammate rows but keeps teamwide ones', () => {
    const conds = [
      entry('Sunna', 'focusedCreation', 'Sunna', 1),
      entry('Sunna', 'm1DefReductionStacks', 'Sunna', 1),
      entry('BlazingLaurel', 'quickOrPerfectAssistUsed', 'Sunna', 1),
      entry('BlazingLaurel', 'wilt', 'Sunna', 2),
      entry(mainKey, 'k', mainKey, 1),
    ]
    const result = filterRelevantConditionals(conds, sunnaMembers())
    expect(result.map((c) => `${c.sheet}:${c.condKey}`)).toEqual([
      'Sunna:m1DefReductionStacks',
      'BlazingLaurel:wilt',
      `${mainKey}:k`,
    ])
  })
})

describe('synthesizeTeammateConditionals', () => {
  it('creates src=teammate rows for missing teammate conditionals', () => {
    const lucyKeys = Object.keys(
      (allConditionalsMeta as Record<string, Record<string, unknown>>)[
        'Lucy'
      ] ?? {}
    )
    expect(lucyKeys.length).toBeGreaterThan(0)
    const result = synthesizeTeammateConditionals(
      [entry('Lucy', lucyKeys[0]!, mainKey, 1)],
      members()
    )
    const synth = result.filter((c) => c.src === ('Lucy' as never))
    expect(synth.map((c) => c.condKey).sort()).toEqual([...lucyKeys].sort())
    for (const c of synth) {
      expect(c.condValue).toBe(0)
      expect(c.dst).toBeNull()
    }
  })

  it('skips rows that already exist and never touches the main member', () => {
    const lucyKeys = Object.keys(
      (allConditionalsMeta as Record<string, Record<string, unknown>>)[
        'Lucy'
      ] ?? {}
    )
    const before = [
      entry('Lucy', lucyKeys[0]!, 'Lucy', 1),
      entry(mainKey, 'k', mainKey, 1),
    ]
    const result = synthesizeTeammateConditionals(before, members())
    // One row per remaining Lucy key, no duplicate of the existing one.
    expect(
      result.filter((c) => c.sheet === 'Lucy' && c.src === ('Lucy' as never))
    ).toHaveLength(lucyKeys.length)
    expect(
      result.filter((c) => c.sheet === mainKey && c.src === mainKey)
    ).toHaveLength(1)
  })
})
