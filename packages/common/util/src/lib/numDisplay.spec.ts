import { getUnitStr, truncateToFixed, valueString } from './numDisplay'

describe('test @zenless-optimizer/common-util/numDisplay', () => {
  it('formats percent values with up to 2 decimals', () => {
    expect(valueString(0.0125, '%')).toEqual('1.25%')
    expect(valueString(0.0025, '%')).toEqual('0.25%')
    expect(valueString(0.15, '%')).toEqual('15%')
    expect(valueString(0.117, '%')).toEqual('11.7%')
    expect(valueString(0.75, '%')).toEqual('75%')
  })

  it('formats non-percent values with magnitude-based precision', () => {
    expect(valueString(0.26)).toEqual('0.26')
    expect(valueString(12.346)).toEqual('12.34')
    expect(valueString(1234.56)).toEqual('1234')
  })

  it('respects an explicit fixed precision', () => {
    expect(valueString(12.34567, '', 3)).toEqual('12.345')
    expect(valueString(2 / 3, '%')).toEqual('66.66%')
  })

  it('truncates large stat values to integers, matching the game', () => {
    expect(valueString(4000.3266)).toEqual('4000')
    expect(valueString(3998.18)).toEqual('3998')
    expect(valueString(-3998.18)).toEqual('-3998')
  })

  it('truncateToFixed truncates without rounding', () => {
    expect(truncateToFixed(3998.18, 0)).toEqual('3998')
    expect(truncateToFixed(12.999, 2)).toEqual('12.99')
    expect(truncateToFixed(-12.349, 2)).toEqual('-12.34')
    expect(truncateToFixed(5, 0)).toEqual('5')
  })

  it('detects percent stat keys', () => {
    expect(getUnitStr('ice_dmg_')).toEqual('%')
    expect(getUnitStr('atk')).toEqual('')
  })
})
