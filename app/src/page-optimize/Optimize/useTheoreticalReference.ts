import type { CharacterKey, DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type {
  BuildRecipe,
  GeneratedBuild,
  ICachedDisc,
  OptConfig,
  OptFrame,
  Team,
  TheoReference,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import type { useCharacterContext } from '@zenless-optimizer/zzz/db-ui'
import {
  buildRowId,
  computeBuildStats,
} from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
} from 'react'
import {
  buildReferenceProfile,
  buildTheoContextSnapshot,
} from '../reference/referenceScoring'
import { resolveEnrichmentFormulaTag } from './buildSelection'
import { createRecipeDiscs } from './optimizeUtils'
import {
  isTheoreticalBuild,
  resolveSelectedRecipeId,
} from './selectedBuildDisplay'

/** Why a pin attempt was rejected — also the console warning text. */
type PinRejection = 'nothing to pin' | 'could not resolve theoretical recipe'

export type PinResolution =
  | { ok: true; recipe: BuildRecipe; value: number }
  | { ok: false; reason: PinRejection }

/**
 * Pin eligibility + recipe resolution for a candidate build: recipe id,
 * recipe metadata, and the display-canonical value, or the reason to bail.
 * Split out as a pure decision (the `pinToggleForSelected` pattern) so the
 * three guards are testable without a database.
 */
export function resolvePinTarget(params: {
  toPin: GeneratedBuild | undefined
  resolveRecipe: (recipeId: string) => BuildRecipe | undefined
  resolveValue: (build: GeneratedBuild) => number
}): PinResolution {
  const { toPin, resolveRecipe, resolveValue } = params
  if (!toPin || !isTheoreticalBuild(toPin.discIds)) {
    return { ok: false, reason: 'nothing to pin' }
  }
  const rid = resolveSelectedRecipeId(toPin.discIds)
  const recipe = rid ? resolveRecipe(rid) : undefined
  if (!rid || !recipe) {
    return { ok: false, reason: 'could not resolve theoretical recipe' }
  }
  // Prefer the display-canonical recomputed value, so the reference matches
  // what the Analysis panel computes for that exact build (the solver's raw
  // value can be off by float rounding).
  const value = resolveValue(toPin)
  if (!(value > 0)) {
    return { ok: false, reason: 'nothing to pin' }
  }
  return { ok: true, recipe, value }
}

/** Inputs for the theoretical-reference hook — values owned by `OptimizeWrapper`. */
export type TheoreticalReferenceInputs = {
  /** Current grid selection — the pin target when no build is passed. */
  selectedBuild: GeneratedBuild
  /** Persisted reference for this character (drives the hydration effect). */
  pinnedReference: TheoReference | undefined
  database: ZzzDatabase
  character: NonNullable<ReturnType<typeof useCharacterContext>>
  characterKey: CharacterKey
  team: Team
  target: OptFrame['tag']
  setFilter2: OptConfig['setFilter2']
  setFilter4: OptConfig['setFilter4']
  /** Display-canonical build values (buildRowId -> recomputed value). */
  enrichedValuesRef: { current: Map<string, number> }
  recipeMetaRef: { current: (recipeId: string) => BuildRecipe | undefined }
  theoreticalDiscMapRef: { current: Record<string, ICachedDisc> }
  setTheoreticalDiscMap: Dispatch<SetStateAction<Record<string, ICachedDisc>>>
}

/**
 * Theoretical-reference pinning: `onPinReference` (materializes the selected
 * recipe build into a persisted reference that survives a refresh) plus the
 * hydration effect that rebuilds the in-memory disc map from it. Verbatim
 * move from `Optimize/index.tsx` — the recipe-id derivation now reuses the
 * shared `isTheoreticalBuild`/`resolveSelectedRecipeId` helpers instead of
 * repeating the `startsWith('recipe_')` + suffix-strip pair.
 */
export function useTheoreticalReference(inputs: TheoreticalReferenceInputs) {
  const {
    selectedBuild,
    pinnedReference,
    database,
    character,
    characterKey,
    team,
    target,
    setFilter2,
    setFilter4,
    enrichedValuesRef,
    recipeMetaRef,
    theoreticalDiscMapRef,
    setTheoreticalDiscMap,
  } = inputs

  // Pin the currently selected theoretical build as this character's perfect
  // reference. Must use the selection — not sorted[0] — because ties on
  // build value (e.g. crit_ vs crit_dmg_ mains with equal value) surface
  // multiple equivalent rows and the user may pick any of them.
  const onPinReference = useCallback(
    (build?: GeneratedBuild) => {
      const toPin = build ?? selectedBuild
      const pinned = resolvePinTarget({
        toPin,
        resolveRecipe: recipeMetaRef.current,
        resolveValue: (b) =>
          enrichedValuesRef.current.get(buildRowId(b)) ?? b.value,
      })
      if (!pinned.ok) {
        console.warn('[TheoReference]', pinned.reason)
        return
      }
      const bestRecipe = pinned.recipe
      const refValue = pinned.value
      const profile = buildReferenceProfile(bestRecipe)
      const snapshot = buildTheoContextSnapshot(target, setFilter2, setFilter4)
      // Materialize the selected build with stable ids so it survives a
      // page refresh (the generator's recipe index lives only in memory).
      // Re-pinning overwrites the same ids.
      const refIdPrefix = `theoref_${characterKey}`
      const referenceDiscs = createRecipeDiscs(bestRecipe, refIdPrefix)
      const refWengineKey = toPin.wengineKey
      // In-combat snapshot of the reference build under the current team, so
      // the comparison panel can show stats without a live calculator.
      // getDisc must resolve teammate discs too — team-wide set bonuses and
      // buffs scaling off teammate gear (e.g. team CRIT DMG) are otherwise
      // silently dropped from the snapshot.
      let referenceCombatStats = undefined as
        | TheoReference['referenceCombatStats']
        | undefined
      try {
        const refDiscMap = Object.fromEntries(
          referenceDiscs.map((d) => [d.slotKey, d])
        ) as Record<DiscSlotKey, ICachedDisc | undefined>
        const refCharacter =
          refWengineKey !== undefined
            ? ({ ...character, wengineKey: refWengineKey } as typeof character)
            : character
        const refFormulaTag = resolveEnrichmentFormulaTag(team)
        const getDisc = (id: string) =>
          theoreticalDiscMapRef.current[id] ??
          database.discs.get(id) ??
          undefined
        const computed = computeBuildStats(
          refCharacter,
          refDiscMap,
          team,
          refFormulaTag,
          (key) => database.chars.get(key) ?? undefined,
          getDisc
        )
        referenceCombatStats = { ...computed.final }
      } catch (e) {
        console.warn('[TheoReference] combat snapshot failed:', e)
      }
      database.theoReferences.pin(characterKey, {
        value: refValue,
        perfectRolls: profile.perfectRolls,
        mainsBySlot: profile.mainsBySlot,
        set4: bestRecipe.set4,
        set2: bestRecipe.set2,
        wengineKey: refWengineKey,
        ...snapshot,
        date: Date.now(),
        bestRecipe,
        referenceDiscs,
        ...(referenceCombatStats ? { referenceCombatStats } : {}),
      })
      console.log('[TheoReference] pinned', refValue, 'for', characterKey)
    },
    [
      selectedBuild,
      database,
      character,
      characterKey,
      enrichedValuesRef,
      recipeMetaRef,
      target,
      team,
      theoreticalDiscMapRef,
      setFilter2,
      setFilter4,
    ]
  )

  // Hydrate the in-memory theoretical disc map from the persisted reference
  // build. The generator's recipe index does not survive a refresh, so
  // without this the pinned build's discs would be unresolvable after one.
  useEffect(() => {
    const discs = pinnedReference?.referenceDiscs
    if (!discs || discs.length === 0) return
    const missing = discs.some((d) => !theoreticalDiscMapRef.current[d.id])
    if (!missing) return
    const next = { ...theoreticalDiscMapRef.current }
    for (const d of discs) next[d.id] = d
    theoreticalDiscMapRef.current = next
    setTheoreticalDiscMap(next)
  }, [pinnedReference, setTheoreticalDiscMap, theoreticalDiscMapRef])

  return { onPinReference }
}
