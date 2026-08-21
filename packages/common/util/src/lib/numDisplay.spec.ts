import { getUnitStr, valueString } from './numDisplay'

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
    expect(valueString(12.346)).toEqual('12.35')
    expect(valueString(1234.56)).toEqual('1234.6')
  })

  it('respects an explicit fixed precision', () => {
    expect(valueString(12.34567, '', 3)).toEqual('12.346')
    expect(valueString(2 / 3, '%')).toEqual('66.67%')
  })

  it('detects percent stat keys', () => {
    expect(getUnitStr('ice_dmg_')).toEqual('%')
    expect(getUnitStr('atk')).toEqual('')
  })
})
