import {
  zodBoolean,
  zodEnumWithDefault,
} from '@zenless-optimizer/common/database'
import {
  notEmpty,
  removeUndefinedFields,
  shallowCompareObj,
  validateValue,
} from '@zenless-optimizer/common/util'
import {
  correctConditionalValue,
  type IConditionalData,
} from '@zenless-optimizer/game-opt/engine'
import { z } from 'zod'
import {
  type AttributeKey,
  allAttributeKeys,
  allCharacterKeys,
  type CharacterKey,
} from '../../../consts'
import type {
  DamageType,
  Dst,
  enemy,
  own,
  Sheet,
  Src,
  Tag,
} from '../../../formula'
import {
  conditionals as allConditionals,
  formulas,
  getConditional,
  isMember,
} from '../../../formula'
import type { ZzzDatabase } from '../..'
import { DataManager } from '../DataManager'

export type critModeKey = 'avg' | 'crit' | 'nonCrit'
export const critModeKeys = ['avg', 'crit', 'nonCrit'] as const

export type SpecificDmgTypeKey = Exclude<
  DamageType,
  'anomaly' | 'disorder' | 'aftershock' | 'elemental'
>
export const specificDmgTypeKeys: SpecificDmgTypeKey[] = [
  'basic',
  'dash',
  'dodgeCounter',
  'special',
  'exSpecial',
  'chain',
  'ult',
  'quickAssist',
  'defensiveAssist',
  'evasiveAssist',
  'assistFollowUp',
  'counterAssist',
  'vortex',
] as const

function isSpecificDmgTypeKey(key: string): key is SpecificDmgTypeKey {
  return specificDmgTypeKeys.includes(key as SpecificDmgTypeKey)
}

export const targetQ = [
  'hp',
  'atk',
  'def',
  'impact',
  'enerRegen',
  'anomProf',
  'anomMas',
] as const
export const targetQt = ['initial', 'final'] as const

export const bonusStatQtKeys = ['combat', 'base', 'initial'] as const
export const bonusStatKeys: Array<keyof typeof own.final> = [
  'hp',
  'hp_',
  'def',
  'def_',
  'atk',
  'atk_',
  'dmg_',
  'enerRegen_',
  'crit_',
  'crit_dmg_',
  'anomProf',
  'impact',
  'impact_',
  'dazeInc_',
  'anomMas_',
  'anomMas',
  'pen_',
  'pen',
  'defIgn_',
  'resIgn_',
  'sheerForce',
  'sheer_dmg_',
  'sharp_dmg_',
  'laceration_dmg_',
] as const
export type BonusStatKey = (typeof bonusStatKeys)[number]

export const bonusStatDmgTypeIncStats = [
  'atk_',
  'defIgn_',
  'dmg_',
  'crit_',
  'crit_dmg_',
  'resIgn_',
] as const

export const enemyStatKeys: Array<keyof typeof enemy.common> = [
  'defRed_',
  'res_',
  'resRed_',
  'stun_',
  'unstun_',
  'anomBuildupRes_',
  'dazeRes_',
  'dazeInc_',
  'dazeRed_',
] as const

export type EnemyStatKey = (typeof enemyStatKeys)[number]

export type BonusStatDamageType = Exclude<
  DamageType,
  'elemental' | 'aftershock'
>
export const bonusStatDamageTypes: BonusStatDamageType[] = [
  'basic',
  'dash',
  'dodgeCounter',
  'special',
  'exSpecial',
  'chain',
  'ult',
  'entrySkill',
  'quickAssist',
  'defensiveAssist',
  'evasiveAssist',
  'assistFollowUp',
  'counterAssist',
  'anomaly',
  'disorder',
  'abloom',
  'vortex',
] as const

export const comboTypeKeys = ['simple', 'advanced'] as const
export type ComboTypeKey = (typeof comboTypeKeys)[number]

/**
 * Which per-hit metric a rotation optimizes. Hits are stored as ability+hit
 * references (usually the DMG variant); the kind selects which sibling
 * variant (`_dmg` / `_daze` / `_anomBuildup`|`_gashBuildup`) each hit reads.
 */
export const comboKindKeys = ['dmg', 'daze', 'buildup'] as const
export type ComboKindKey = (typeof comboKindKeys)[number]

/** Version of the serialized advanced-rotation combo state. */
export const COMBO_STATE_VERSION = '1.0'
/** Max rotation hits with distinct buff states (limited by calc presets). */
export const MAX_COMBO_HITS = 50

export type ComboHit = {
  sheet: string
  name: string
  /** Hit count / weight multiplier for this action. Defaults to 1. */
  multiplier?: number
}

export type TargetTag = {
  sheet?: string
  name?: string
  damageType1?: SpecificDmgTypeKey
  damageType2?: 'aftershock' | 'abloom'
  q?: (typeof targetQ)[number]
  qt?: (typeof targetQt)[number]
  rotation?: ComboHit[]
  comboType?: ComboTypeKey
  comboKind?: ComboKindKey
  /** Versioned JSON blob with per-hit buff overrides (advanced mode). */
  comboStateJson?: string
}

const comboHitSchema = z.object({
  sheet: z.string(),
  name: z.string(),
  multiplier: z.number().positive().finite().catch(1),
})

const targetTagSchema = z
  .object({
    sheet: z.string().optional(),
    name: z.string().optional(),
    damageType1: z.string().optional(),
    damageType2: z.literal('aftershock').or(z.literal('abloom')).optional(),
    q: z.enum(targetQ).optional(),
    qt: z.enum(targetQt).optional(),
    rotation: z.array(comboHitSchema).optional(),
    comboType: zodEnumWithDefault(comboTypeKeys, 'simple'),
    comboKind: z.enum(comboKindKeys).optional(),
    comboStateJson: z.string().optional(),
  })
  .optional() as z.ZodType<TargetTag | undefined>

const conditionalSchema = z.object({
  sheet: z.string() as z.ZodType<Sheet>,
  src: z.string() as z.ZodType<Src>,
  dst: z.string().nullable() as z.ZodType<Dst>,
  condKey: z.string(),
  condValue: z.number(),
})

export type TeamConditional = z.infer<typeof conditionalSchema>

export type BonusStatTag = {
  q: BonusStatKey
  qt: (typeof bonusStatQtKeys)[number]
  attribute?: AttributeKey
  damageType1?: BonusStatDamageType
  damageType2?: 'aftershock' | 'abloom'
}

const bonusStatTagSchema = z.object({
  q: z.string(),
  qt: z.string(),
  attribute: z.string().optional(),
  damageType1: z.string().optional(),
  damageType2: z.literal('aftershock').or(z.literal('abloom')).optional(),
}) as z.ZodType<BonusStatTag>

const bonusStatSchema = z.object({
  tag: bonusStatTagSchema,
  value: z.number().catch(0),
  disabled: zodBoolean(),
})

export type TeamBonusStat = z.infer<typeof bonusStatSchema>

export type EnemyStatsTag = {
  q: EnemyStatKey
  attribute?: AttributeKey
}

const enemyStatsTagSchema = z.object({
  q: z.string(),
  attribute: z.string().optional(),
}) as z.ZodType<EnemyStatsTag>

const enemyStatSchema = z.object({
  tag: enemyStatsTagSchema,
  value: z.number().catch(0),
})

export type TeamEnemyStat = z.infer<typeof enemyStatSchema>

const optFrameSchema = z.object({
  tag: targetTagSchema,
  multiplier: z.number().positive().catch(1),
  critMode: zodEnumWithDefault(critModeKeys, 'avg'),
  bonusStats: z.array(bonusStatSchema).catch([]),
  conditionals: z.array(conditionalSchema).catch([]),
  enemyStats: z.array(enemyStatSchema).catch([]),
  description: z.string().optional(),
})

export type OptFrame = z.infer<typeof optFrameSchema>

const teammateDatumSchema = z.object({
  characterKey: z.enum(allCharacterKeys),
  optConfigId: z.string().optional(),
  mindscape: z.number().int().min(0).max(6).optional(),
  wenginePhase: z.number().int().min(1).max(5).optional(),
  discSet4Key: z.string().optional(),
})

export type TeammateDatum = z.infer<typeof teammateDatumSchema>

const teamSchema = z.object({
  teammates: z.array(teammateDatumSchema).catch([]),
  frames: z.array(optFrameSchema).catch([]),
  enemyLvl: z.number().catch(80),
  enemyDef: z.number().catch(953),
  enemyStunMultiplier: z.number().catch(150),
})

export type Team = z.infer<typeof teamSchema>

export class TeamDataManager extends DataManager<
  CharacterKey,
  'teams',
  Team,
  Team
> {
  constructor(database: ZzzDatabase) {
    super(database, 'teams')
  }

  override validate(obj: unknown, key: CharacterKey): Team | undefined {
    const result = teamSchema.safeParse(obj)
    if (!result.success) return undefined

    const {
      teammates: rawTeammates,
      frames: rawFrames,
      enemyLvl,
      enemyDef,
      enemyStunMultiplier,
    } = result.data

    const teammates = this.validateTeammates(rawTeammates, key)
    if (!teammates) return undefined

    const frames = rawFrames
      .map((frame) => this.validateOptFrame(frame))
      .filter(notEmpty)
      .map((frame) => ({
        ...frame,
        conditionals: backfillConditionals(
          frame.conditionals,
          teammates[0].characterKey
        ),
      }))

    return {
      teammates,
      frames,
      enemyLvl,
      enemyDef,
      enemyStunMultiplier,
    }
  }

  private validateTeammates(
    rawTeammates: TeammateDatum[],
    cacheKey: CharacterKey
  ): TeammateDatum[] | undefined {
    if (rawTeammates.length > 3) return undefined
    if (rawTeammates[0]?.characterKey !== cacheKey) return undefined

    const seen = new Set<CharacterKey>()
    const teammates: TeammateDatum[] = []

    for (const raw of rawTeammates) {
      if (seen.has(raw.characterKey)) continue
      seen.add(raw.characterKey)

      const optConfigId =
        raw.optConfigId &&
        this.database.optConfigs.keys.includes(raw.optConfigId)
          ? raw.optConfigId
          : undefined

      teammates.push({
        characterKey: raw.characterKey,
        optConfigId,
        mindscape: raw.mindscape,
        wenginePhase: raw.wenginePhase,
        discSet4Key: raw.discSet4Key,
      })
    }

    return teammates
  }

  private validateOptFrame(raw: OptFrame): OptFrame | undefined {
    const result = optFrameSchema.safeParse(raw)
    if (!result.success) return undefined

    const {
      tag: rawTarget,
      multiplier,
      critMode,
      bonusStats: rawBonusStats,
      conditionals: rawConditionals,
      enemyStats: rawEnemyStats,
      description,
    } = result.data

    const tag = this.validateTargetTag(rawTarget)
    const bonusStats = this.validateBonusStats(rawBonusStats)
    const conditionals = this.validateConditionals(rawConditionals)
    const enemyStats = this.validateEnemyStats(rawEnemyStats)

    return {
      tag,
      multiplier,
      critMode,
      bonusStats,
      conditionals,
      enemyStats,
      description,
    }
  }

  private validateEnemyStats(rawEnemyStats: TeamEnemyStat[]): TeamEnemyStat[] {
    return rawEnemyStats
      .map(({ tag, value }) => {
        const q = validateValue(tag.q, enemyStatKeys)
        if (!q) return undefined

        let { attribute } = tag
        if (attribute)
          attribute = validateValue(attribute, allAttributeKeys) as
            | AttributeKey
            | undefined

        return {
          tag: removeUndefinedFields({
            q,
            attribute,
          }) as EnemyStatsTag,
          value,
        }
      })
      .filter(notEmpty)
  }
  /**
   * Validate a frame0 target tag. The single-target part (formula or stat)
   * and the rotation part validate independently and coexist: a stored
   * rotation stays editable while a single target is selected (HSR-style
   * detachment). The solver sums the rotation only when it is the *active*
   * target — see `isComboTarget`.
   */
  private validateTargetTag(
    rawTarget: TargetTag | undefined
  ): TargetTag | undefined {
    if (!rawTarget) return undefined

    const rotation = rawTarget.rotation
      ? rawTarget.rotation
          .filter(({ sheet, name }) => {
            const formula = getFormula({ sheet, name })
            return !!formula
          })
          .slice(0, MAX_COMBO_HITS)
          .map(({ sheet, name, multiplier }) =>
            removeUndefinedFields({
              sheet,
              name,
              multiplier:
                multiplier && multiplier !== 1 ? multiplier : undefined,
            })
          )
      : []

    let single: TargetTag | undefined
    if (rawTarget.name) {
      const formula = getFormula(rawTarget)
      if (formula) {
        let damageType1: SpecificDmgTypeKey | undefined
        let damageType2: 'aftershock' | 'abloom' | undefined
        if (
          formula.name === 'standardDmgInst' ||
          formula.name === 'sheerDmgInst'
        ) {
          if (
            rawTarget.damageType1 &&
            isSpecificDmgTypeKey(rawTarget.damageType1)
          )
            damageType1 = rawTarget.damageType1
          if (
            rawTarget.damageType2 === 'aftershock' ||
            rawTarget.damageType2 === 'abloom'
          )
            damageType2 = rawTarget.damageType2
        }
        single = removeUndefinedFields({
          sheet: formula.sheet,
          name: formula.name,
          damageType1,
          damageType2,
        }) as TargetTag
      }
    } else {
      const { q, qt } = rawTarget
      if (q && qt && targetQ.includes(q) && targetQt.includes(qt)) {
        single = { q, qt }
      }
    }

    if (rotation.length === 0 && !single) return undefined
    const merged: Record<string, unknown> = { ...single }
    if (rotation.length > 0) {
      merged.rotation = rotation
      merged.comboType =
        rawTarget.comboType === 'advanced' ? 'advanced' : undefined
      merged.comboKind =
        rawTarget.comboKind === 'daze' || rawTarget.comboKind === 'buildup'
          ? rawTarget.comboKind
          : undefined
      merged.comboStateJson = validateComboStateJson(
        rawTarget.comboStateJson,
        rotation.length
      )
    }
    return removeUndefinedFields(merged) as TargetTag
  }

  private validateConditionals(
    rawConditionals: TeamConditional[]
  ): TeamConditional[] {
    const hashList: string[] = []
    return rawConditionals
      .map(({ sheet, condKey, src, dst, condValue }) => {
        if (condValue === undefined || condValue === null) return undefined
        if (!isMember(src) || !(dst === null || isMember(dst))) return undefined
        const cond = getConditional(sheet, condKey)
        if (!cond) return undefined

        const hash = `${sheet}:${condKey}:${src}:${dst}`
        if (hashList.includes(hash)) return undefined
        hashList.push(hash)

        return {
          sheet,
          src,
          dst,
          condKey,
          condValue: correctConditionalValue(cond, condValue),
        }
      })
      .filter(notEmpty)
  }

  private validateBonusStats(rawBonusStats: TeamBonusStat[]): TeamBonusStat[] {
    return rawBonusStats
      .map(({ tag, value, disabled }) => {
        const q = validateValue(tag.q, bonusStatKeys)
        const qt = validateValue(tag.qt, bonusStatQtKeys)
        if (!q || !qt) return undefined

        let { attribute, damageType1, damageType2 } = tag

        if (q !== 'dmg_' && q !== 'sheer_dmg_' && q !== 'resIgn_')
          attribute = undefined
        if (attribute)
          attribute = validateValue(attribute, allAttributeKeys) as
            | AttributeKey
            | undefined

        if (
          !bonusStatDmgTypeIncStats.includes(
            q as (typeof bonusStatDmgTypeIncStats)[number]
          )
        )
          damageType1 = undefined
        if (damageType1)
          damageType1 = validateValue(damageType1, bonusStatDamageTypes) as
            | BonusStatDamageType
            | undefined

        if (q !== 'dmg_' && q !== 'crit_dmg_') damageType2 = undefined
        if (
          damageType2 &&
          damageType2 !== 'aftershock' &&
          damageType2 !== 'abloom'
        )
          damageType2 = undefined

        return {
          tag: removeUndefinedFields({
            q,
            qt,
            attribute,
            damageType1,
            damageType2,
          }) as BonusStatTag,
          value,
          disabled,
        }
      })
      .filter(notEmpty)
  }

  override toStorageKey(key: string): string {
    return `${this.goKeySingle}_${key}`
  }
  override toCacheKey(key: string): CharacterKey {
    return key.split(`${this.goKeySingle}_`)[1] as CharacterKey
  }

  getOrCreate(key: CharacterKey): Team {
    if (!this.keys.includes(key)) {
      this.set(key, initialTeam(key))
    }
    return this.get(key) as Team
  }

  setFrameConditional(
    teamKey: CharacterKey,
    frameIndex: number,
    sheet: Sheet,
    condKey: string,
    src: Src,
    dst: Dst,
    condValue: number
  ) {
    this.set(teamKey, (team) => {
      const frames = [...team.frames]
      const frame = frames[frameIndex]
      if (!frame) return false

      const conditionals = [...frame.conditionals]
      const condIndex = conditionals.findIndex(
        (c) =>
          c.condKey === condKey &&
          c.sheet === sheet &&
          c.src === src &&
          c.dst === dst
      )
      if (condIndex === -1) {
        conditionals.push({ sheet, src, dst, condKey, condValue })
      } else {
        const cond = conditionals[condIndex]
        if (
          cond.sheet === sheet &&
          cond.src === src &&
          cond.dst === dst &&
          cond.condKey === condKey &&
          cond.condValue === condValue
        )
          return false
        cond.sheet = sheet
        cond.src = src
        cond.dst = dst
        cond.condKey = condKey
        cond.condValue = condValue
      }
      frames[frameIndex] = { ...frame, conditionals }
      return { frames }
    })
  }

  setFrameBonusStat(
    teamKey: CharacterKey,
    frameIndex: number,
    tag: BonusStatTag,
    value: number | null,
    disabled: boolean,
    index = -1
  ) {
    this.set(teamKey, (team) => {
      const frames = [...team.frames]
      const frame = frames[frameIndex]
      if (!frame) return false

      const bonusStats = [...frame.bonusStats]
      if (index === -1 && value !== null) {
        bonusStats.push({ tag, value, disabled })
      } else if (value === null && index >= 0 && index < bonusStats.length) {
        bonusStats.splice(index, 1)
      } else if (value !== null && index >= 0 && index < bonusStats.length) {
        bonusStats[index].value = value
        bonusStats[index].tag = tag
        bonusStats[index].disabled = disabled
      }
      frames[frameIndex] = { ...frame, bonusStats }
      return { frames }
    })
  }

  setFrameEnemyStat(
    teamKey: CharacterKey,
    frameIndex: number,
    tag: EnemyStatsTag,
    value: number | null,
    index?: number
  ) {
    this.set(teamKey, (team) => {
      const frames = [...team.frames]
      const frame = frames[frameIndex]
      if (!frame) return false

      const statIndex =
        index ??
        frame.enemyStats.findIndex((s) => shallowCompareObj(s.tag, tag))
      const enemyStats = [...frame.enemyStats]
      if (statIndex === -1 && value !== null) {
        enemyStats.push({ tag, value })
      } else if (
        value === null &&
        statIndex >= 0 &&
        statIndex < enemyStats.length
      ) {
        enemyStats.splice(statIndex, 1)
      } else if (
        value !== null &&
        statIndex >= 0 &&
        statIndex < enemyStats.length
      ) {
        enemyStats[statIndex].value = value
        enemyStats[statIndex].tag = tag
      }
      frames[frameIndex] = { ...frame, enemyStats }
      return { frames }
    })
  }

  setFrame0(
    teamKey: CharacterKey,
    update: Partial<OptFrame> | ((frame: OptFrame) => Partial<OptFrame> | false)
  ) {
    this.set(teamKey, (team) => {
      const frame0 = getTeamFrame0(team)
      const patch = typeof update === 'function' ? update(frame0) : update
      if (patch === false) return false
      const frames = [...team.frames]
      frames[0] = { ...frame0, ...patch }
      return { frames }
    })
  }

  setTeammateOverride(
    teamKey: CharacterKey,
    characterKey: CharacterKey,
    override: {
      mindscape?: number
      wenginePhase?: number
      discSet4Key?: string
    }
  ) {
    this.set(teamKey, (team) => ({
      teammates: team.teammates.map((t) =>
        t.characterKey === characterKey ? { ...t, ...override } : t
      ),
    }))
  }

  setTeammateOptConfigId(
    teamKey: CharacterKey,
    characterKey: CharacterKey,
    optConfigId: string
  ) {
    this.set(teamKey, (team) => ({
      teammates: team.teammates.map((t) =>
        t.characterKey === characterKey ? { ...t, optConfigId } : t
      ),
    }))
  }

  /** UI picker index 0–1 maps to teammates slots [1] and [2]. */
  setTeammate(
    teamKey: CharacterKey,
    teammate: CharacterKey | null,
    uiPickerIndex?: number
  ) {
    this.set(teamKey, (team) => {
      const slotIndex =
        uiPickerIndex === undefined
          ? team.teammates.findIndex((t) => t.characterKey === teammate)
          : uiPickerIndex + 1

      if (slotIndex < 1) return false

      const teammates = [...team.teammates]

      if (teammate === null && slotIndex > 0 && slotIndex < teammates.length) {
        teammates.splice(slotIndex, 1)
      } else if (teammate !== null) {
        const existing = teammates.find((t) => t.characterKey === teammate)
        if (existing && teammates.indexOf(existing) !== slotIndex) {
          teammates.splice(teammates.indexOf(existing), 1)
        }
        if (slotIndex < teammates.length) {
          teammates[slotIndex] = {
            ...teammates[slotIndex],
            characterKey: teammate,
          }
        } else if (teammates.length < 3) {
          teammates.push({ characterKey: teammate })
        }
      }

      return { teammates }
    })
  }
}

function defaultConditionals(mainKey: CharacterKey): TeamConditional[] {
  const result: TeamConditional[] = []
  const conds = allConditionals as Record<
    string,
    Record<string, IConditionalData>
  >
  for (const [sheet, sheetConds] of Object.entries(conds)) {
    for (const [condKey, condData] of Object.entries(sheetConds)) {
      const condValue =
        condData.type === 'bool'
          ? 1
          : condData.type === 'num'
            ? (condData.max ?? 10)
            : 0
      result.push({
        sheet: sheet as Sheet,
        src: mainKey as Src,
        dst: null as Dst,
        condKey,
        condValue,
      })
    }
  }
  return result
}

/**
 * Add default (enabled) entries for conditionals that are missing from the
 * frame. Only entries absent by full key are added; explicitly set values
 * (including disabled/0) are preserved. This keeps cached/imported teams
 * consistent with fresh teams and with the values the UI displays by default.
 */
function backfillConditionals(
  conditionals: TeamConditional[],
  mainKey: CharacterKey
): TeamConditional[] {
  const existing = new Set(
    conditionals.map((c) => `${c.sheet}:${c.condKey}:${c.src}:${c.dst}`)
  )
  const missing = defaultConditionals(mainKey).filter(
    (d) => !existing.has(`${d.sheet}:${d.condKey}:${d.src}:${d.dst}`)
  )
  if (missing.length === 0) return conditionals
  return [...conditionals, ...missing]
}

const emptyFrame0 = (mainKey: CharacterKey): OptFrame => ({
  tag: undefined,
  multiplier: 1,
  critMode: 'avg',
  bonusStats: [],
  conditionals: defaultConditionals(mainKey),
  enemyStats: [],
})

// for the current implementation the team is limited to only the first frame.
export function getTeamFrame0(team: Team): OptFrame {
  const mainKey = getMainCharacterKey(team)
  return team.frames[0] ?? emptyFrame0(mainKey)
}

export function initialTeam(mainKey: CharacterKey): Team {
  return {
    teammates: [{ characterKey: mainKey, optConfigId: undefined }],
    frames: [emptyFrame0(mainKey)],
    enemyLvl: 80,
    enemyDef: 953,
    enemyStunMultiplier: 150,
  }
}

// for the current implementation, the opt is only for the first/main character
export function getMainCharacterKey(team: Team): CharacterKey {
  return team.teammates[0].characterKey
}
export function getMainCharacterOptConfigId(team: Team): string | undefined {
  return team.teammates[0].optConfigId
}

export function findTeammate(
  team: Team,
  characterKey: CharacterKey
): TeammateDatum | undefined {
  return team.teammates.find((t) => t.characterKey === characterKey)
}

export function getTeamOptConfigId(
  team: Team,
  characterKey: CharacterKey
): string | undefined {
  return findTeammate(team, characterKey)?.optConfigId
}

export function teamCharacterKeys(team: Team): CharacterKey[] {
  return team.teammates.map((t) => t.characterKey)
}

export function teamToSolverFrames(team: Team) {
  return team.frames
    .map(({ tag, multiplier }) =>
      tag
        ? {
            tag: targetTag(tag),
            multiplier,
          }
        : undefined
    )
    .filter(notEmpty)
}

export function applyDamageTypeToTag(
  tag: Tag,
  damageType1: DamageType | undefined | null,
  damageType2: DamageType | undefined | null
): Tag {
  return {
    ...tag,
    ...(damageType1 ? { damageType1 } : {}),
    ...(damageType2 ? { damageType2 } : {}),
  }
}

function getFormula({ sheet, name }: TargetTag) {
  if (!sheet || !name) return
  return (formulas as any)[sheet]?.[name] as
    | {
        sheet: Sheet
        name: string
        tag: Tag
      }
    | undefined
}

/**
 * Advanced rotation combo state (ported from HSR optimizer's ComboState).
 *
 * Instead of HSR's per-action boolean `activations` + value `partitions`,
 * each conditional stores its numeric value per hit directly (`condValue`
 * already covers bool 0/1, num and list indices), which subsumes partitions.
 * Hit 0 (the main-form defaults shown in the conditionals drawers) is not
 * stored here — it lives in `frames[0].conditionals` as before.
 */
export type ComboState = {
  version: string
  /** `${sheet}:${condKey}:${src}:${dst}` → one value per rotation hit. */
  values: Record<string, number[]>
  /** Extra (unequipped) disc set sheets shown in the advanced drawer. */
  extraSets?: string[]
}

export function comboCondHash(
  sheet: string,
  condKey: string,
  src: string,
  dst: string | null
): string {
  return `${sheet}:${condKey}:${src}:${dst ?? ''}`
}

function comboHashOf(c: TeamConditional): string {
  return comboCondHash(c.sheet, c.condKey, c.src, c.dst)
}

/** Parse + sanity-check a stored combo blob. Returns undefined when stale. */
export function parseComboState(
  json: string | undefined,
  hitCount: number
): ComboState | undefined {
  if (!json) return undefined
  try {
    const parsed = JSON.parse(json) as ComboState
    if (!parsed || parsed.version !== COMBO_STATE_VERSION) return undefined
    if (!parsed.values || typeof parsed.values !== 'object') return undefined
    for (const arr of Object.values(parsed.values)) {
      if (!Array.isArray(arr) || arr.length !== hitCount) return undefined
      if (!arr.every((v) => typeof v === 'number' && Number.isFinite(v)))
        return undefined
    }
    if (
      parsed.extraSets !== undefined &&
      (!Array.isArray(parsed.extraSets) ||
        !parsed.extraSets.every((s) => typeof s === 'string'))
    )
      return undefined
    return parsed
  } catch {
    return undefined
  }
}

function validateComboStateJson(
  json: string | undefined,
  hitCount: number
): string | undefined {
  if (!json) return undefined
  // Drop stale blobs (wrong version / hit count / non-numeric values) so the
  // UI re-initializes them from the frame defaults on next open.
  return parseComboState(json, hitCount) ? json : undefined
}

/**
 * Remap a stored combo blob onto a new hit sequence, preserving per-hit
 * values by position. New hits (or unknown hashes) fall back to the frame
 * defaults; dropped hits are discarded. Always returns a valid blob for
 * `newLength` hits (initializing from defaults when the previous blob is
 * missing or stale).
 *
 * `indexMap` maps each new hit index to its previous hit index (`-1` for
 * newly added hits). Pass an identity map to only fix up lengths.
 */
export function remapComboState(
  conditionals: TeamConditional[],
  prevJson: string | undefined,
  indexMap: number[]
): string {
  let prev: ComboState | undefined
  if (prevJson) {
    try {
      const parsed = JSON.parse(prevJson) as ComboState
      if (
        parsed &&
        parsed.version === COMBO_STATE_VERSION &&
        parsed.values &&
        typeof parsed.values === 'object'
      )
        prev = parsed
    } catch {
      // Stale/corrupt blob — fall through to defaults.
    }
  }
  const values: Record<string, number[]> = {}
  for (const c of conditionals) {
    const hash = comboHashOf(c)
    const old = prev?.values[hash]
    values[hash] = indexMap.map((oldI) => {
      const v = oldI >= 0 ? old?.[oldI] : undefined
      return typeof v === 'number' && Number.isFinite(v) ? v : c.condValue
    })
  }
  return JSON.stringify({
    version: COMBO_STATE_VERSION,
    values,
    ...(prev?.extraSets ? { extraSets: prev.extraSets } : {}),
  })
}

/**
 * Build a fresh combo state from the frame defaults: every hit inherits the
 * main-form conditional values (HSR's `initializeComboState` equivalent).
 */
export function initializeComboState(
  conditionals: TeamConditional[],
  hitCount: number
): ComboState {
  const values: Record<string, number[]> = {}
  for (const c of conditionals)
    values[comboHashOf(c)] = Array(hitCount).fill(c.condValue)
  return { version: COMBO_STATE_VERSION, values }
}

// Skill-variant formula suffix, mirroring parseSkillVariant in
// page-optimize/OptTargetTagDisplay (kept local: db must not depend on UI).
const comboVariantRe = /^(.+)_(\d+)_(dmg|daze|anomBuildup|gashBuildup)$/

/**
 * Map a rotation hit to the formula read for the given combo metric.
 *
 * Skill-variant hits (`<ability>_<idx>_<dmg|daze|anomBuildup|gashBuildup>`)
 * resolve to the sibling variant of the same ability+hit, so a rotation
 * stores each hit once and the opt target selects which metric to sum.
 * Non-variant formulas only count toward DMG. Returns undefined when the
 * hit has no formula for that metric (the hit is skipped for the sum).
 */
export function comboHitTarget(
  hit: ComboHit,
  kind: ComboKindKey
): { sheet: string; name: string } | undefined {
  if (kind === 'dmg') return { sheet: hit.sheet, name: hit.name }
  const match = hit.name.match(comboVariantRe)
  if (!match) return undefined
  const [, ability, idx] = match
  const candidates =
    kind === 'daze'
      ? [`${ability}_${idx}_daze`]
      : [`${ability}_${idx}_anomBuildup`, `${ability}_${idx}_gashBuildup`]
  for (const name of candidates) {
    if (getFormula({ sheet: hit.sheet, name }))
      return { sheet: hit.sheet, name }
  }
  return undefined
}

/**
 * Whether the rotation is the *active* optimization target. A stored
 * rotation coexists with a single-target selection (staged, still editable
 * in the combo card) — only a rotation with no single-target fields of its
 * own is summed by the solver.
 */
export function isComboTarget(
  tag: TargetTag | undefined
): tag is TargetTag & { rotation: ComboHit[] } {
  return (
    !!tag?.rotation &&
    tag.rotation.length > 0 &&
    !tag.sheet &&
    !tag.name &&
    !tag.q &&
    !tag.qt
  )
}

/**
 * Expand the team's optimization frames for combo calculation.
 *
 * - No active rotation → the stored frames (unchanged legacy behavior,
 *   including staged rotations under a single-target selection).
 * - Simple rotation → one frame per hit sharing frame0's buff state.
 * - Advanced rotation → one frame per hit with per-hit conditional values
 *   from `comboStateJson` (missing/stale entries fall back to frame0).
 *
 * Each hit reads the sibling variant selected by `comboKind` (DMG by
 * default); hits without a formula for that metric are skipped. Advanced
 * overrides are looked up by original rotation index, while the returned
 * frames are densely indexed so each maps to calc `preset${i}`, matching
 * the solver's multi-preset summation in `createSolverConfig`.
 */
export function getComboFrames(team: Team): OptFrame[] {
  const frame0 = getTeamFrame0(team)
  const tag = frame0.tag
  if (!isComboTarget(tag))
    return team.frames.length > 0 ? team.frames : [frame0]
  const rotation = tag.rotation

  const kind = frame0.tag?.comboKind ?? 'dmg'
  const isAdvanced = frame0.tag?.comboType === 'advanced'
  const combo = isAdvanced
    ? parseComboState(frame0.tag?.comboStateJson, rotation.length)
    : undefined

  const resolved = rotation
    .map((hit, index) => {
      const resolvedTag = comboHitTarget(hit, kind)
      return resolvedTag ? { hit, resolvedTag, index } : undefined
    })
    .filter(notEmpty)

  return resolved.map(({ hit, resolvedTag, index }) => {
    let conditionals = frame0.conditionals
    if (combo) {
      conditionals = frame0.conditionals.map((c) => {
        const override = combo.values[comboHashOf(c)]?.[index]
        if (override === undefined) return c
        const cond = getConditional(c.sheet, c.condKey)
        const condValue = cond
          ? correctConditionalValue(cond, override)
          : override
        return condValue === c.condValue ? c : { ...c, condValue }
      })
    }
    return {
      ...frame0,
      tag: removeUndefinedFields({
        sheet: resolvedTag.sheet,
        name: resolvedTag.name,
      }),
      multiplier: hit.multiplier ?? 1,
      conditionals,
    }
  })
}

export function targetTag(target: TargetTag): Tag {
  const { damageType1, damageType2 } = target
  const formula = getFormula(target)
  if (formula)
    return applyDamageTypeToTag(formula.tag, damageType1, damageType2)
  return {
    et: 'own',
    q: target.q ?? 'atk',
    qt: target.qt ?? 'final',
    sheet: 'agg',
  }
}

export function newBonusStatTag(q: BonusStatKey): BonusStatTag {
  return {
    q,
    qt: 'combat',
  }
}
export function newEnemyStatTag(q: EnemyStatKey): EnemyStatsTag {
  return {
    q,
  }
}
