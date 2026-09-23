import { describe, expect, it } from 'vitest'
import { ExpandedDataPanel } from '../Optimize/ExpandedDataPanel'
import { ActionBreakdown } from './ActionBreakdown'
import { DamageSplits } from './DamageSplits'
import { DamageSplitsChart } from './DamageSplitsChart'
import { DamageTagPieChart } from './DamageTagPieChart'
import { StatsDiffCard } from './StatsDiffCard'
import { DamageUpgrades } from './SubstatUpgrades'

/**
 * Guards the panel's module graph: the analysis cards share basenames
 * (`DamageSplits.tsx` / the extraction util), so a resolver picking the
 * wrong file or a stale export surfaces here instead of at runtime.
 */
describe('analysis panel modules', () => {
  it('exposes every card as a component', () => {
    for (const component of [
      StatsDiffCard,
      ActionBreakdown,
      DamageSplits,
      DamageSplitsChart,
      DamageTagPieChart,
      DamageUpgrades,
      ExpandedDataPanel,
    ]) {
      expect(component).toBeTypeOf('function')
    }
  })
})
