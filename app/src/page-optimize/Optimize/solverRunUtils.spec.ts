import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import {
  buildTheoryPermutationDetails,
  createRecipeMetaResolver,
  readDebugSubstatTargets,
  sliceResultsToLimit,
} from './solverRunUtils'

const mem = (raw: string | null) => ({
  getItem: () => raw,
})

describe('readDebugSubstatTargets', () => {
  it('returns undefined when absent', () => {
    expect(readDebugSubstatTargets(mem(null))).toBeUndefined()
  })
  it('parses valid JSON targets', () => {
    expect(readDebugSubstatTargets(mem('{"atk_":23,"ap":16}'))).toEqual({
      atk_: 23,
      ap: 16,
    })
  })
  it('returns undefined on parse errors', () => {
    expect(readDebugSubstatTargets(mem('{bad'))).toBeUndefined()
  })
  it('returns undefined when storage throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied')
      },
    }
    expect(readDebugSubstatTargets(throwing)).toBeUndefined()
  })
})

describe('sliceResultsToLimit', () => {
  it('slices over-limit results to the requested count', () => {
    const results = [{ value: 3 }, { value: 2 }, { value: 1 }]
    expect(sliceResultsToLimit(results, 2)).toEqual([
      { value: 3 },
      { value: 2 },
    ])
  })
  it('returns the same array when within limit', () => {
    const results = [{ value: 1 }]
    expect(sliceResultsToLimit(results, 5)).toBe(results)
  })
})

describe('buildTheoryPermutationDetails', () => {
  it('reports the recipe space identically for every slot', () => {
    const details = buildTheoryPermutationDetails(42)
    expect(Object.keys(details).sort()).toEqual([...allDiscSlotKeys].sort())
    for (const slot of allDiscSlotKeys)
      expect(details[slot]).toEqual({ count: 42, total: 42 })
  })
})

describe('createRecipeMetaResolver', () => {
  const pipeline = {
    recipeIndex: new Uint16Array(0),
    context: { recipeCount: 0 },
  } as never
  it('returns undefined for non-recipe ids without touching the index', () => {
    expect(createRecipeMetaResolver(pipeline)('plain_1')).toBeUndefined()
  })
  it('returns undefined for out-of-range recipe ids', () => {
    expect(createRecipeMetaResolver(pipeline)('recipe_7')).toBeUndefined()
  })
})
