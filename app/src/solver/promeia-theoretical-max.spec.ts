import {
  compileTagMapValues,
  setDebugMode,
} from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../consts'
import {
  charTagMapNodeEntries,
  conditionalEntries,
  convert,
  discTagMapNodeEntries,
  enemy,
  own,
  ownTag,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '../formula'
import { Calculator } from '../formula/calculator'
import { data, keys, values } from '../formula/data'
import type { TagMapNodeEntries } from '../formula/data/util'
import { generateTheoreticalDiscs } from './generateTheoreticalDiscs'

setDebugMode(true)
Object.assign(values, compileTagMapValues(keys, data))

describe('Promeia theoretical max', () => {
  it('evaluates theoretical max recipes via formula.base and compares with expected build', () => {
    const charKey = 'Promeia'
    const wengineKey: WengineKey = 'FrostfallSickle'
    const setFilter2 = ['PhaethonsMelody']
    const setFilter4 = ['NotesFromTheChained']

    // ── 1. Generate theoretical max discs ──
    const { recipes, recipeMap } = generateTheoreticalDiscs(
      charKey,
      setFilter2,
      setFilter4,
      { 4: ['anomProf'], 5: ['ice_dmg_'], 6: ['anomMas_'] }
    )
    console.log(`Generated ${recipes.length} recipes`)

    // ── 2. Base entries ──
    function buildCalc(
      recipeStats: Record<string, number>,
      setCounts: Record<string, number>
    ): Calculator {
      const entries: TagMapNodeEntries = [
        ...teamData([charKey]),
        ...withMember(
          charKey,
          ...charTagMapNodeEntries({
            key: charKey,
            level: 60,
            promotion: 5,
            core: 6,
            basic: 11,
            dodge: 11,
            special: 11,
            chain: 11,
            assist: 11,
            mindscape: 0,
          }),
          ...wengineTagMapNodeEntries({
            key: wengineKey,
            level: 60,
            modification: 5,
            phase: 1,
          }),
          ...discTagMapNodeEntries(recipeStats, setCounts as any),
          ...[conditionalEntries(wengineKey, charKey, null)('specialUsed', 0)]
        ),
        own.common.critMode.add('avg'),
        enemy.common.def.add(953),
      ]
      return new Calculator(keys, values, compileTagMapValues(keys, entries))
    }

    // ── 3. Evaluate recipes using formula.base path ──
    const aggReader = convert(ownTag, { et: 'own', sheet: 'agg', src: charKey })
    const baseFormulaRead = aggReader.formula.base.with(
      'name',
      'trialByColdAbloomDmgInst'
    )

    // Test a sample (first 300) to keep test fast
    const sampleSize = Math.min(300, recipes.length)

    // Evaluate each recipe once, cache results for both best and top-5
    const results: { idx: number; val: number; meta: any }[] = []
    for (let i = 0; i < sampleSize; i++) {
      const r = recipes[i] as Record<string, any>
      const recipeStats: Record<string, number> = {}
      const setCounts: Record<string, number> = {}
      for (const [key, val] of Object.entries(r)) {
        if (key === 'id') continue
        if (key === setFilter4[0] || key === setFilter2[0]) {
          setCounts[key] = val as number
        } else if (typeof val === 'number' && val !== 0) {
          recipeStats[key] = val as number
        }
      }

      const calc = buildCalc(recipeStats, setCounts)
      const val = calc.compute(baseFormulaRead).val
      results.push({ idx: i, val, meta: recipeMap[String(r.id)] })
    }

    results.sort((a, b) => b.val - a.val)

    console.log(`Evaluated ${sampleSize} recipes out of ${recipes.length}`)
    console.log(
      `Best value: ${results[0].val.toFixed(4)}, at index ${results[0].idx}`
    )
    expect(results[0].val).toBeGreaterThan(0)
    expect(results[0].idx).toBeGreaterThanOrEqual(0)

    // ── 4. Print best recipe details ──
    const bestMeta = results[0].meta
    console.log(`\n=== BEST BUILD (sample of ${sampleSize}) ===`)
    console.log(`Main stats: ${JSON.stringify(bestMeta?.mainStats)}`)
    console.log(`Total rolls: ${JSON.stringify(bestMeta?.totalRolls)}`)

    // ── 5. Top 5 results ──
    const top5 = results.slice(0, 5)
    console.log('\n=== TOP 5 RESULTS ===')
    for (const { idx, val, meta } of top5) {
      const rid = String(recipes[idx].id)
      console.log(`\n#${idx} value=${val.toFixed(2)} recipe=${rid}`)
      console.log(`  Main: ${JSON.stringify(meta?.mainStats)}`)
      console.log(`  Rolls: ${JSON.stringify(meta?.totalRolls)}`)
    }

    // ── 6. Verify main stats ──
    expect(bestMeta?.mainStats['4']).toBe('anomProf')
    expect(bestMeta?.mainStats['5']).toBe('ice_dmg_')
    expect(bestMeta?.mainStats['6']).toBe('anomMas_')
    expect(bestMeta?.set4).toBe('NotesFromTheChained')
    expect(bestMeta?.set2).toBe('PhaethonsMelody')
  })
})
