import { constant, max, prod, sum } from '@zenless-optimizer/pando/engine'
import type { AttributeKey } from '../../../consts'
import type { TagMapNodeEntries } from '../util'
import { allNumConditionals, customAnomalyDmg, own, percent } from '../util'

export const { anomTimePassed } = allNumConditionals('anomaly', true, 0, 20)

// Vortex DMG base multipliers per attribute (matching document values)
// Vortex is Wind's core reaction (replaces Disorder). When a Wind Anomaly
// interacts with other attribute anomalies, Vortex DMG is triggered.
const vortexBaseMultipliers: Record<string, number> = {
  fire: 9, // Burn Vortex: 900%
  electric: 6.5, // Shock Vortex: 650%
  ether: 6.5, // Corruption Vortex: 650%
  ice: 13, // Ice Freeze Vortex: 1300%
  physical: 8, // Assault Vortex: 800%
  frost: 0, // Frost Freeze Vortex: 0% (time-only)
}

// Vortex time-based multipliers (same structure as disorder per document)
const vortexTimeMultipliers: Record<string, number> = {
  fire: 1, // [t / 0.5] * 50% = t * 100%
  electric: 1.25,
  ether: 1.25, // [t / 0.5] * 62.5% = t * 125%
  ice: 0.075,
  physical: 0.075,
  frost: 0.75,
}

// Generate Vortex DMG formulas for each non-wind attribute
const vortexDmgEntries: TagMapNodeEntries = Object.entries(
  vortexBaseMultipliers
).flatMap(([attr, baseMv]) =>
  customAnomalyDmg(
    `vortexDmgInst_${attr}`,
    {
      damageType1: 'anomaly',
      damageType2: 'vortex',
      attribute: attr === 'frost' ? 'ice' : (attr as AttributeKey),
    },
    prod(
      sum(
        percent(baseMv),
        own.final.addl_disorder_,
        prod(
          max(
            0,
            sum(
              constant(attr === 'frost' ? 20 : 10),
              prod(constant(-1), anomTimePassed)
            )
          ),
          percent(vortexTimeMultipliers[attr])
        )
      ),
      own.final.atk,
      // Base DMG Bonus% multiplier per the Anomaly DMG Formula:
      // Base DMG = [(MV * DMG Ratio) * Scaling Stat] * (1 + Base DMG Bonus%) + Flat Base DMG Bonus
      sum(percent(1), own.final.anom_mv_mult_)
    )
  )
)

// Vortex DMG formulas — exported without sheet wrapper. The `register()`
// function would add `sheet: 'agg'` here, but that triggers rereads at
// `{sheet: 'agg'}` in `common/index.ts`, which follow to targets with no
// entries and duplicate all pipeline entries. `listFormulas` doesn't need
// a sheet — it gathers at `{et: 'own', qt: 'listing', q: 'formulas'}`.
const vortexData = vortexDmgEntries

export default vortexData
