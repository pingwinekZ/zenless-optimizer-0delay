import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import {
  extractWengineConditionalFields,
  extractWengineCondLabels,
  extractWenginePassiveGroups,
  isBuffFieldTeamWide,
  isWengineCondVisible,
} from './wengineConditionalUtils'

describe('isBuffFieldTeamWide', () => {
  it('honors the explicit team flag without metadata', () => {
    expect(
      isBuffFieldTeamWide(undefined, { team: true } as unknown as Field)
    ).toBe(true)
    expect(
      isBuffFieldTeamWide(undefined, { team: false } as unknown as Field)
    ).toBe(false)
  })
  it('looks up buff metadata by fieldRef name', () => {
    const buffs = { foo: { team: true } }
    const tag = (name: string) =>
      ({ title: null, fieldRef: { name } }) as unknown as Field
    expect(isBuffFieldTeamWide(buffs, tag('foo'))).toBe(true)
  })
  it('treats unresolvable fields as not team-wide', () => {
    expect(
      isBuffFieldTeamWide(undefined, {
        title: null,
        fieldValue: 1,
      } as unknown as Field)
    ).toBe(false)
  })
})

describe('extractWengineCondLabels', () => {
  it('returns non-function labels keyed by conditional', () => {
    const labels = extractWengineCondLabels('SteelCushion')
    expect(labels).toBeDefined()
    expect(Object.keys(labels!).length).toBeGreaterThan(0)
    for (const label of Object.values(labels!)) {
      expect(typeof label === 'function').toBe(false)
    }
  })
  it('returns undefined without a wengine', () => {
    expect(extractWengineCondLabels('')).toBeUndefined()
  })
})

describe('extractWengineConditionalFields', () => {
  it('teammate view is a subset of own-view conditionals', () => {
    const own = extractWengineConditionalFields('SteelCushion', undefined)
    const team = extractWengineConditionalFields('SteelCushion', 'Anby')
    expect(own).toBeDefined()
    expect(team).toBeDefined()
    for (const key of Object.keys(team!)) {
      expect(own).toHaveProperty(key)
    }
  })
  it('keeps team-buff conditionals visible in teammate view', () => {
    expect(
      extractWengineConditionalFields('NeonFantasies', 'Anby')
    ).toBeDefined()
  })
})

describe('extractWenginePassiveGroups', () => {
  it('returns groups with fields for wengines that declare them', () => {
    const groups = extractWenginePassiveGroups('SteelCushion', undefined)
    expect(groups).toBeDefined()
    expect(groups!.length).toBeGreaterThan(0)
    for (const g of groups!) {
      expect(g.fields.length).toBeGreaterThan(0)
    }
  })
  it('returns undefined when the sheet has no fields documents', () => {
    expect(
      extractWenginePassiveGroups('Housekeeper', undefined)
    ).toBeUndefined()
  })
})

describe('isWengineCondVisible', () => {
  it('always hides the passive-team-buffs pseudo conditional', () => {
    expect(
      isWengineCondVisible(
        'SteelCushion',
        '__passive_team_buffs__',
        undefined,
        undefined,
        undefined
      )
    ).toBe(false)
  })
  it('hides conditionals whose fields were all filtered out', () => {
    expect(
      isWengineCondVisible('SteelCushion', 'hit_behind', {}, 'Anby', undefined)
    ).toBe(false)
    expect(
      isWengineCondVisible(
        'SteelCushion',
        'hit_behind',
        undefined,
        'Anby',
        undefined
      )
    ).toBe(true)
  })
  it('gates SolExuvia eclipse on Phaethon faction', () => {
    expect(
      isWengineCondVisible(
        'SolExuvia',
        'eclipse_active',
        undefined,
        undefined,
        'Phaethon'
      )
    ).toBe(true)
    expect(
      isWengineCondVisible(
        'SolExuvia',
        'eclipse_active',
        undefined,
        undefined,
        'CunningHares'
      )
    ).toBe(false)
  })
  it('hides self-only conditionals from teammate view', () => {
    const cases: Array<[string, string]> = [
      ['ChiefSidekick', 'offField'],
      ['YesterdayCalls', 'offField'],
      ['Thoughtbop', 'offField'],
      ['Metanukimorphosis', 'physical_exSpecial_ult'],
      ['SpectralGaze', 'spiritLock'],
      ['BlazingLaurel', 'quickOrPerfectAssistUsed'],
      ['WeepingCradle', 'offField'],
    ]
    for (const [w, c] of cases) {
      expect(
        isWengineCondVisible(w as never, c, undefined, 'Anby', undefined)
      ).toBe(false)
      expect(
        isWengineCondVisible(w as never, c, undefined, undefined, undefined)
      ).toBe(true)
    }
  })
  it('shows unrelated conditionals', () => {
    expect(
      isWengineCondVisible('SteelCushion', 'hit_behind', undefined, 'Anby', 'X')
    ).toBe(true)
  })
})
