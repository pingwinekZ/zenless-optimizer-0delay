import { describe, it } from 'vitest'
import { generateTheoreticalDiscs } from './generateTheoreticalDiscs'

describe('findMaxHP', () => {
  it('scans all recipes for max initial.hp', () => {
    const charKey = 'Zhao' as any
    const setFilter2: any[] = ['MoonlightLullaby']
    const setFilter4: any[] = ['BunnyInWonderland']
    const { recipes, recipeMap } = generateTheoreticalDiscs(
      charKey,
      setFilter2,
      setFilter4
    )
    console.log(`Generated ${recipes.length} recipes`)

    const BASE_HP = 9117.4144
    const NON_DISC_HP_ = 0.1 + 0.3 + 0.18

    let maxHP = -Infinity
    let maxR: any = null
    let maxIdx = -1
    let count27k = 0

    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i] as any
      const hp = r.hp ?? 0
      const hp_ = r.hp_ ?? 0
      const initialHP = BASE_HP * (1 + NON_DISC_HP_ + hp_) + hp
      if (initialHP > maxHP) {
        maxHP = initialHP
        maxR = { id: r.id, hp, hp_ }
        maxIdx = i
      }
      if (initialHP >= 27000) count27k++
    }

    console.log(`\n=== GLOBAL MAX INITIAL HP ===`)
    console.log(`Recipe #${maxIdx}: ${JSON.stringify(maxR)}`)
    console.log(`Max initial.hp: ${maxHP.toFixed(4)}`)
    console.log(`>= 27000? ${maxHP >= 27000 ? 'YES' : 'NO'}`)
    console.log(`Recipes >= 27k: ${count27k} / ${recipes.length}`)

    // Also print some context about the recipe
    const recipeMeta = recipeMap[maxR!.id]
    if (recipeMeta) {
      console.log(`\nRecipe main stats:`, JSON.stringify(recipeMeta.mainStats))
      console.log(`Total rolls:`, JSON.stringify(recipeMeta.totalRolls))
      console.log(`Appearances:`, JSON.stringify(recipeMeta.appearances))
    }
  })
})
