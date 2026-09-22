import {
  extractCharConditionalDescriptions,
  extractCharConditionalFields,
  extractCharConditionalLabels,
  extractCharConditionalUiOptions,
  extractCharPassiveFields,
  getMindscapeRequirement,
  passiveSectionToDescKey,
  SECTION_DISPLAY_NAMES,
  SECTION_ORDER,
} from './characterConditionalsUtils'

describe('getMindscapeRequirement', () => {
  it('parses m1-m6 prefixes', () => {
    expect(getMindscapeRequirement('m1_chain')).toBe(1)
    expect(getMindscapeRequirement('M6_ult')).toBe(6)
  })
  it('returns null for non-mindscape conditionals', () => {
    expect(getMindscapeRequirement('core_pass')).toBeNull()
    expect(getMindscapeRequirement('basic_atk')).toBeNull()
  })
})

describe('passiveSectionToDescKey', () => {
  it('maps core/potential/mindscape sections', () => {
    expect(passiveSectionToDescKey('core', 'ability_foo', 3, 6)).toBe(
      'ability.desc'
    )
    expect(passiveSectionToDescKey('core', 'core_atk', 3, 6)).toBe(
      'core.desc.3'
    )
    expect(passiveSectionToDescKey('potential', null, 0, 6)).toBe(
      'potential.desc.6'
    )
    expect(passiveSectionToDescKey('m2', null, 0, 6)).toBe('mindscapes.2.desc')
    expect(passiveSectionToDescKey('basic', null, 0, 6)).toBeNull()
  })
})

describe('section metadata', () => {
  it('covers every SECTION_ORDER key with a display name', () => {
    for (const key of SECTION_ORDER) {
      expect(SECTION_DISPLAY_NAMES[key]).toBeTruthy()
    }
  })
})

describe('extractCharConditionalLabels', () => {
  it('returns non-function labels keyed by conditional', () => {
    const labels = extractCharConditionalLabels('Anby')
    expect(labels).toBeDefined()
    expect(Object.keys(labels!).length).toBeGreaterThan(0)
    for (const label of Object.values(labels!)) {
      expect(typeof label === 'function').toBe(false)
    }
  })
})

describe('extractCharConditionalDescriptions', () => {
  it('returns string descriptions keyed by conditional', () => {
    const descs = extractCharConditionalDescriptions('Nicole')
    expect(descs).toBeDefined()
    expect(Object.keys(descs!).length).toBeGreaterThan(0)
  })
})

describe('extractCharConditionalUiOptions', () => {
  it('returns mindscape-gated options where sheets declare them', () => {
    const opts = extractCharConditionalUiOptions('Piper')
    expect(opts).toBeDefined()
    expect(Object.keys(opts!).length).toBeGreaterThan(0)
  })
  it('returns undefined when no sheet declares options', () => {
    expect(extractCharConditionalUiOptions('Anby')).toBeUndefined()
  })
})

describe('extractCharConditionalFields', () => {
  it('teammate view is a subset of own-view conditionals', () => {
    const own = extractCharConditionalFields('Lucy', undefined, 6)
    const team = extractCharConditionalFields('Lucy', 'Anby', 6)
    expect(own).toBeDefined()
    expect(team).toBeDefined()
    for (const key of Object.keys(team!)) {
      expect(own).toHaveProperty(key)
    }
  })
})

describe('extractCharPassiveFields', () => {
  it('returns entries tagged with section and mindscape', () => {
    const passives = extractCharPassiveFields('Anby', undefined, 6)
    expect(passives).toBeDefined()
    expect(passives!.length).toBeGreaterThan(0)
    for (const p of passives!) {
      expect(typeof p.sectionKey).toBe('string')
      expect(typeof p.mindscape).toBe('number')
      expect(p.fields.length).toBeGreaterThan(0)
    }
  })
})
