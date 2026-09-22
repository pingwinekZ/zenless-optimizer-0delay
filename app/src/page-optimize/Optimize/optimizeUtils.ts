import type { WebGpuSolverOptions } from '@zenless-optimizer/game-opt/solver-webgpu'
import type {
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
} from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe, ICachedDisc } from '@zenless-optimizer/zzz/db'

/**
 * GPU tuning knobs read from the URL (?wg=512&cycles=512&f16=1&chunks=2),
 * for A/B testing the WebGPU solver without rebuilding. Parsed from both the
 * query string and the hash fragment (the app routes in the hash). Absent
 * params fall back to the proven defaults (256/256, f32, 4 target chunks).
 */
export function getGpuTuningParams(): WebGpuSolverOptions {
  const q = new URLSearchParams(window.location.search)
  const hashQ = window.location.hash.split('?')[1]
  if (hashQ)
    for (const [k, v] of new URLSearchParams(hashQ)) if (!q.has(k)) q.set(k, v)
  const wg = q.get('wg')
  const cycles = q.get('cycles')
  const f16 = q.get('f16')
  const db = q.get('db')
  const chunks = q.get('chunks')
  const chunkms = q.get('chunkms')
  const cal = q.get('cal')
  return {
    ...(wg ? { workgroupSize: Number(wg) } : {}),
    ...(cycles ? { cyclesPerInvocation: Number(cycles) } : {}),
    ...(f16 ? { f16: f16 === '1' || f16 === 'true' } : {}),
    ...(db ? { doubleBuffer: db === '1' || db === 'true' } : {}),
    ...(chunks ? { targetChunks: Number(chunks) } : {}),
    ...(chunkms ? { chunkMs: Number(chunkms) } : {}),
    ...(cal ? { calibrate: cal === '1' || cal === 'true' } : {}),
  }
}

/**
 * Recover a recipe's index from its id (`recipe_123` -> `123`). Recipe ids are
 * assigned in enumeration order, which is exactly the compact descriptor
 * index, so the id alone is enough to rebuild the recipe's metadata.
 */
export function recipeIndexFromId(recipeId: string): number | undefined {
  if (!recipeId.startsWith('recipe_')) return undefined
  const index = Number(recipeId.slice('recipe_'.length))
  return Number.isInteger(index) && index >= 0 ? index : undefined
}

/**
 * Create 6 fake ICachedDisc objects from a recipe for stat computation.
 * The formula's discsToTagMapNodeEntries accumulates stats across all
 * discs, so we create one disc per slot with the correct main stat and
 * set assignment. Substats come from the recipe's per-disc assignment
 * (which never duplicates a disc's main stat). The substats must be
 * preserved verbatim — dropping any would make the displayed stats
 * diverge from the values the solver constrained on.
 */
export function createRecipeDiscs(
  recipe: BuildRecipe,
  recipeId: string
): ICachedDisc[] {
  const base = (
    slotKey: DiscSlotKey,
    mainStatKey: DiscMainStatKey,
    setKey: DiscSetKey
  ): ICachedDisc => ({
    id: `${recipeId}_${slotKey}`,
    setKey,
    slotKey,
    level: 15,
    rarity: 'S' as const,
    mainStatKey,
    substats: [],
    location: '',
    lock: false,
    trash: false,
  })

  const slotKeys: DiscSlotKey[] = ['1', '2', '3', '4', '5', '6']

  return slotKeys.map((slotKey, discIdx) => {
    const mainStatKey = recipe.mainStats[slotKey]
    const setKey =
      slotKey === '4' || slotKey === '1' || slotKey === '2' || slotKey === '3'
        ? recipe.set4
        : recipe.set2

    const substats = recipe.perDiscSubstats?.[discIdx] ?? []

    return {
      ...base(slotKey, mainStatKey, setKey),
      substats,
    }
  })
}
