import type { Tag } from '@zenless-optimizer/zzz/formula'
import { describe, expect, it } from 'vitest'
import { optTargetLabel } from './actionLabel'

describe('optTargetLabel', () => {
  it('labels shared formulas by their damage-type label', () => {
    const tag = {
      et: 'own',
      qt: 'formula',
      q: 'anomalyDmg',
      sheet: 'Alice',
      attribute: 'physical',
      damageType1: 'anomaly',
      name: 'anomalyDmgInst',
    } as unknown as Tag

    expect(optTargetLabel(tag)).toBe('Anomaly DMG')
  })

  it('keeps prefixed variants like disorder readable', () => {
    const tag = {
      et: 'own',
      qt: 'formula',
      q: 'anomalyDmg',
      sheet: 'Alice',
      damageType1: 'disorder',
      name: 'disorderDmgInst_physical',
    } as unknown as Tag

    expect(optTargetLabel(tag)).toBe('Disorder DMG')
  })

  it('falls back to `sheet.name` only when nothing else resolves', () => {
    const tag = {
      et: 'own',
      qt: 'formula',
      q: 'formula',
      sheet: 'Alice',
      name: 'someUnmappedFormula',
    } as unknown as Tag

    expect(optTargetLabel(tag)).toBe('someUnmappedFormula')
  })
})
