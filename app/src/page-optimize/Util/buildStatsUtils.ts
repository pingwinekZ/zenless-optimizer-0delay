import { notEmpty, toDecimal } from '@zenless-optimizer/common/util'
import { presets } from '@zenless-optimizer/game-opt/engine'
import { constant } from '@zenless-optimizer/pando/engine'
import type {
  CharacterKey,
  DiscSetKey,
  DiscSlotKey,
  PhaseKey,
} from '../../consts'
import type {
  DiscIds,
  ICachedCharacter,
  ICachedDisc,
  Team,
  TeammateDatum,
} from '../../db'
import { getTeamFrame0, teamCharacterKeys } from '../../db'
import type { Tag } from '../../formula'
import {
  charTagMapNodeEntries,
  conditionalEntries,
  convert,
  DEFAULT_TEAMMATE_CHAR,
  discsToTagMapNodeEntries,
  enemy,
  ownBuff,
  ownTag,
  Read,
  type TagMapNodeEntries,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
  withPreset,
  zzzCalculatorWithEntries,
} from '../../formula'
import { allStats } from '../../stats'

/** Stats derived from final (combat) calculations */
export type BuildCombatStats = {
  hp: number
  atk: number
  def: number
  impact: number
  critRate: number
  critDmg: number
  penRatio: number
  pen: number
  enerRegen: number
  anomProf: number
  anomMas: number
  sheerForce: number
  dmgBonus: number
  defIgn: number
}

/** Stats derived from base calculations (before combat buffs) */
export type BuildBaseStats = {
  hp: number
  atk: number
  def: number
  impact: number
  critRate: number
  critDmg: number
  penRatio: number
  pen: number
  enerRegen: number
  anomProf: number
  anomMas: number
  sheerForce: number
}

export type EnrichedBuild = {
  id: string
  index: number
  value: number
  wengineKey?: string
  wengineName?: string
  discIds: DiscIds
  discSetIds: string[]
  combatStats: BuildCombatStats | null
  baseStats: BuildBaseStats | null
}

/**
 * Compute enriched stats for a single build by creating a temporary
 * formula calculator with the build's disc/wengine data.
 * Returns both final (combat) and base stat sets simultaneously.
 */
export function computeBuildStats(
  character: ICachedCharacter,
  discs: Record<DiscSlotKey, ICachedDisc | undefined>,
  team: Team,
  targetTag?: Tag | Tag[],
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined,
  getDisc?: (id: string) => ICachedDisc | undefined
): { final: BuildCombatStats; base: BuildBaseStats; targetValue?: number } {
  const entries = buildCalculatorEntries(
    character,
    discs,
    team,
    getTeammateChar,
    getDisc
  )
  const calc = zzzCalculatorWithEntries(entries)

  // Must match the `src` set by `withMember()` above
  const ownReader = convert(ownTag, { et: 'own', src: character.key })
  // Combat stats require a preset to pick up withPreset-scoped entries
  // (conditionals, bonus stats, teammate buffs, enemy stats)
  const combatReader = convert(ownTag, {
    et: 'own',
    src: character.key,
    preset: 'preset0',
  })

  const final: BuildCombatStats = {
    hp: calc.compute(combatReader.final.hp).val,
    atk: calc.compute(combatReader.final.atk).val,
    def: calc.compute(combatReader.final.def).val,
    impact: calc.compute(combatReader.final.impact).val,
    critRate: calc.compute(combatReader.common.cappedCrit_).val,
    critDmg: calc.compute(combatReader.final.crit_dmg_).val,
    penRatio: calc.compute(combatReader.final.pen_).val,
    pen: calc.compute(combatReader.final.pen).val,
    enerRegen: calc.compute(combatReader.final.enerRegen).val,
    anomProf: calc.compute(combatReader.final.anomProf).val,
    anomMas: calc.compute(combatReader.final.anomMas).val,
    sheerForce: calc.compute(combatReader.final.sheerForce).val,
    dmgBonus: calc.compute(combatReader.final.dmg_).val,
    defIgn: calc.compute(combatReader.final.defIgn_).val,
  }

  const base: BuildBaseStats = {
    hp: calc.compute(ownReader.initial.hp).val,
    atk: calc.compute(ownReader.initial.atk).val,
    def: calc.compute(ownReader.initial.def).val,
    impact: calc.compute(ownReader.initial.impact).val,
    critRate: calc.compute(ownReader.initial.crit_).val,
    critDmg: calc.compute(ownReader.initial.crit_dmg_).val,
    penRatio: calc.compute(ownReader.initial.pen_).val,
    pen: calc.compute(ownReader.initial.pen).val,
    enerRegen: calc.compute(ownReader.initial.enerRegen).val,
    anomProf: calc.compute(ownReader.initial.anomProf).val,
    anomMas: calc.compute(ownReader.initial.anomMas).val,
    sheerForce: calc.compute(ownReader.initial.sheerForce).val,
  }

  if (targetTag) {
    const tags = Array.isArray(targetTag) ? targetTag : [targetTag]
    const targetValue = tags.reduce((sum, tag) => {
      const targetRead = new Read(
        { src: character.key, ...tag },
        undefined
      ).with('preset', 'preset0' as any)
      const val = calc.compute(targetRead).val
      return sum + val
    }, 0)
    return { final, base, targetValue }
  }

  return { final, base, targetValue: undefined }
}

/**
 * Batch compute stats for an array of builds.
 * Uses requestIdleCallback-style batching to avoid blocking the UI.
 * Returns a Promise that resolves with an array of enriched builds.
 */
export async function batchComputeBuildStats(
  builds: { discIds: DiscIds; value: number; wengineKey?: string }[],
  getDisc: (id: string) => ICachedDisc | undefined,
  character: ICachedCharacter,
  team: Team,
  onProgress?: (completed: number, total: number) => void,
  targetTag?: Tag | Tag[],
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined
): Promise<EnrichedBuild[]> {
  const BATCH_SIZE = 10
  const enriched: EnrichedBuild[] = []
  const total = builds.length

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = builds.slice(i, i + BATCH_SIZE)

    // Yield to browser between batches
    if (i > 0) {
      await new Promise<void>((resolve) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => resolve(), { timeout: 50 })
        } else {
          setTimeout(resolve, 0)
        }
      })
    }

    for (let j = 0; j < batch.length; j++) {
      const build = batch[j]
      const discEntries = Object.entries(build.discIds).map(([slot, id]) => {
        const disc = id ? getDisc(id) : undefined
        if (id?.startsWith('recipe_') && !disc) {
          console.warn('[batchCompute] MISSING recipe disc:', id, 'slot:', slot)
        } else if (id?.startsWith('recipe_') && disc) {
          console.log(
            '[batchCompute] FOUND recipe disc:',
            id,
            'slot:',
            slot,
            'setKey:',
            disc.setKey,
            'mainStat:',
            disc.mainStatKey
          )
        }
        return [slot, disc] as const
      })
      const discs = Object.fromEntries(discEntries) as Record<
        DiscSlotKey,
        ICachedDisc | undefined
      >

      const discValues = Object.values(discs).filter(notEmpty)

      // Get disc set keys
      const setCounts = new Map<string, number>()
      for (const disc of discValues) {
        const setKey = disc.setKey
        setCounts.set(setKey, (setCounts.get(setKey) ?? 0) + 1)
      }
      const discSetIds = Array.from(setCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key)
      let combatStats: BuildCombatStats | null = null
      let baseStats: BuildBaseStats | null = null
      let value = build.value
      try {
        const result = computeBuildStats(
          character,
          discs,
          team,
          targetTag,
          getTeammateChar,
          getDisc
        )
        combatStats = result.final
        baseStats = result.base
        // For rotation DMG (array targetTag), the solver already computed
        // the correct multi-preset value — don't override it with the
        // post-solver single-preset computation.
        if (!Array.isArray(targetTag) && result.targetValue !== undefined) {
          value = result.targetValue
        }
      } catch {
        // If stats computation fails, leave as null
      }

      enriched.push({
        id: buildRowId(build),
        index: i + j,
        value,
        wengineKey: build.wengineKey,
        discIds: build.discIds,
        discSetIds,
        combatStats,
        baseStats,
      })
    }

    onProgress?.(Math.min(i + BATCH_SIZE, total), total)
  }

  return enriched
}

/**
 * Build the calculator entries for a given build, used for computing
 * both stats and the optimization target value.
 */
export function buildCalculatorEntries(
  character: ICachedCharacter,
  discs: Record<DiscSlotKey, ICachedDisc | undefined>,
  team: Team,
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined,
  getDisc?: (id: string) => ICachedDisc | undefined
): TagMapNodeEntries {
  const teamMembers = teamCharacterKeys(team)
  const frames = team.frames.length > 0 ? team.frames : [getTeamFrame0(team)]

  // Build withMember entries for all non-main teammates using their roster data + overrides
  const teammateEntries = team.teammates
    .filter((t) => t.characterKey !== character.key)
    .flatMap((teammateDatum: TeammateDatum) => {
      const {
        characterKey: charKey,
        mindscape: overrideMindscape,
        wenginePhase: overridePhase,
        discSet4Key,
      } = teammateDatum

      // Look up the teammate's roster data (if available)
      const teammateChar = getTeammateChar?.(charKey)

      // Use override if present, otherwise fall back to roster data, then defaults
      const mindscape = overrideMindscape ?? teammateChar?.mindscape ?? 0
      const wengineKey = teammateChar?.wengineKey
      const wenginePhase = (overridePhase ??
        teammateChar?.wenginePhase ??
        1) as PhaseKey

      const teammateDiscs =
        getDisc && teammateChar
          ? Object.values(teammateChar.equippedDiscs)
              .map((id) => (id ? getDisc(id) : undefined))
              .filter(notEmpty)
          : []
      const discEntries: TagMapNodeEntries =
        teammateDiscs.length > 0
          ? discsToTagMapNodeEntries(teammateDiscs)
          : discSet4Key
            ? [ownBuff.common.count.sheet(discSet4Key as DiscSetKey).add(4)]
            : []

      return [
        ...withMember(
          charKey,
          ...charTagMapNodeEntries({
            key: charKey,
            level: teammateChar?.level ?? DEFAULT_TEAMMATE_CHAR.level,
            promotion:
              teammateChar?.promotion ?? DEFAULT_TEAMMATE_CHAR.promotion,
            basic: teammateChar?.basic ?? DEFAULT_TEAMMATE_CHAR.basic,
            dodge: teammateChar?.dodge ?? DEFAULT_TEAMMATE_CHAR.dodge,
            special: teammateChar?.special ?? DEFAULT_TEAMMATE_CHAR.special,
            chain: teammateChar?.chain ?? DEFAULT_TEAMMATE_CHAR.chain,
            assist: teammateChar?.assist ?? DEFAULT_TEAMMATE_CHAR.assist,
            core: teammateChar?.core ?? DEFAULT_TEAMMATE_CHAR.core,
            mindscape,
            potential:
              teammateChar?.potential ?? DEFAULT_TEAMMATE_CHAR.potential,
          }),
          ...wengineTagMapNodeEntries(
            wengineKey
              ? {
                  key: wengineKey,
                  level: 60,
                  modification: 5,
                  phase: wenginePhase,
                }
              : undefined
          ),
          ...discEntries
        ),
        // Teammate count bonuses (specialty, faction, attribute)
        ownBuff.common.count
          .withSpecialty(allStats.char[charKey].specialty as any)
          .add(1),
        ownBuff.common.count
          .withFaction(allStats.char[charKey].faction as any)
          .add(1),
        ownBuff.common.count
          .withTag({ attribute: allStats.char[charKey].attribute as any })
          .add(1),
      ]
    })

  return [
    ...teamData(teamMembers),
    ...withMember(
      character.key,
      ...charTagMapNodeEntries({
        key: character.key,
        level: character.level,
        promotion: character.promotion,
        basic: character.basic,
        dodge: character.dodge,
        special: character.special,
        chain: character.chain,
        assist: character.assist,
        core: character.core,
        mindscape: character.mindscape,
        potential: character.potential,
      }),
      ...wengineTagMapNodeEntries(
        character.wengineKey
          ? {
              key: character.wengineKey,
              level: 60,
              modification: 5,
              phase: character.wenginePhase as PhaseKey,
            }
          : undefined
      ),
      ...discsToTagMapNodeEntries(Object.values(discs).filter(notEmpty))
    ),
    ...teammateEntries,
    enemy.common.lvl.add(team.enemyLvl),
    enemy.common.def.add(team.enemyDef),
    enemy.common.stun_.add(team.enemyStunMultiplier / 100),
    enemy.common.unstun_.add(1),
    ...frames.flatMap((frame, i) => {
      const preset = presets[i] ?? 'preset0'
      return [
        ...withPreset(preset, ownBuff.common.critMode.add(frame.critMode)),
        ...frame.conditionals.flatMap(
          ({ sheet, src, dst, condKey, condValue }) =>
            withPreset(
              preset,
              conditionalEntries(sheet, src, dst)(condKey, condValue)
            )
        ),
        ...frame.bonusStats
          .filter(({ disabled }) => !disabled)
          .flatMap(({ tag, value }) => {
            const { damageType1, ...rest } = tag
            const baseTag = {
              ...rest,
              src: character.key,
              sheet: 'agg',
              et: 'own',
            } as any
            const entries: TagMapNodeEntries = [
              {
                tag: damageType1 ? { ...baseTag, damageType1 } : baseTag,
                value: constant(toDecimal(value, tag.q ?? '')),
              },
            ]
            // Create a second entry with damageType2 to match formulas
            // that use the damage type in the second slot
            // (e.g., Vortex formula uses damageType2: 'vortex').
            // Mirrors how Read getters (e.g., ownBuff.combat.dmg_.vortex)
            // return [damageType1, damageType2] for each damage type.
            if (damageType1)
              entries.push({
                tag: { ...baseTag, damageType2: damageType1 },
                value: constant(toDecimal(value, tag.q ?? '')),
              })
            return withPreset(preset, ...entries)
          }),
        ...frame.enemyStats.flatMap(({ tag, value }) =>
          withPreset(preset, {
            tag: {
              ...tag,
              qt: 'common',
              et: 'enemy',
              sheet: 'agg',
            } as any,
            value: constant(toDecimal(value, tag.q ?? '')),
          })
        ),
      ]
    }),
  ]
}

/**
 * Build a unique stable row ID from a build's wengine + disc combination.
 */
export function buildRowId(build: {
  wengineKey?: string
  discIds: DiscIds
}): string {
  return `${build.wengineKey ?? ''}-${Object.values(build.discIds).join('-')}`
}

/** Display name (short) for each stat */
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  atk: 'ATK',
  def: 'DEF',
  impact: 'IMP',
  critRate: 'CR',
  critDmg: 'CD',
  sheerForce: 'SF',
  pen: 'PEN',
  enerRegen: 'ER',
  anomProf: 'AP',
  anomMas: 'AM',
}
