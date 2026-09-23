import { describe, expect, it } from 'vitest'
import {
  formatBuffValue,
  formatPercent,
  formatSignedInt,
  trimTrailingZeros,
} from './format'

describe('trimTrailingZeros', () => {
  it('drops padded decimals', () => {
    expect(trimTrailingZeros('10.00')).toBe('10')
    expect(trimTrailingZeros('10.50')).toBe('10.5')
    expect(trimTrailingZeros('0.00')).toBe('0')
    expect(trimTrailingZeros('2.34')).toBe('2.34')
  })

  it('leaves whole numbers untouched', () => {
    expect(trimTrailingZeros('100')).toBe('100')
    expect(trimTrailingZeros('0')).toBe('0')
  })
})

describe('formatPercent', () => {
  it('renders without useless zeros', () => {
    expect(formatPercent(0.1)).toBe('10%')
    expect(formatPercent(0.125)).toBe('12.5%')
    expect(formatPercent(0.075)).toBe('7.5%')
    expect(formatPercent(0)).toBe('0%')
  })
})

describe('formatBuffValue', () => {
  it('formats percent buffs compactly', () => {
    expect(formatBuffValue(0.1, true)).toBe('10%')
    expect(formatBuffValue(0.1, false)).toBe('0')
    expect(formatBuffValue(0.075, true)).toBe('7.5%')
    expect(formatBuffValue(0.0125, true)).toBe('1.25%')
  })

  it('rounds flat stats to locale-grouped integers', () => {
    expect(formatBuffValue(227.44, false)).toBe('227')
    expect(formatBuffValue(1234.6, false)).toBe('1,235')
  })
})

describe('formatSignedInt', () => {
  it('marks the sign explicitly', () => {
    expect(formatSignedInt(12.4)).toBe('+12')
    expect(formatSignedInt(-12.4)).toBe('−12')
  })
})
