import type { CalcMeta } from '@zenless-optimizer/game-opt/engine'
import type { CalcResult } from '@zenless-optimizer/pando/engine'
import type {
  CharacterKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import { getDiscSubStatBaseVal, statKeyTextMap } from '../../consts'
import type {
  DiscIds,
  ICachedCharacter,
  ICachedDisc,
  OptFrame,
  Team,
  TeammateDatum,
} from '../../db'
import { getTeamFrame0, targetTag } from '../../db'
import type { Tag } from '../../formula'
import { convert, ownTag, Read, zzzCalculatorWithEntries } from '../../formula'
import type { ISubstat } from '../../schema/disc'
import type { BuildCombatStats, EnrichedBuild } from '../Util/buildStatsUtils'
import { buildCalculatorEntries } from '../Util/buildStatsUtils'

export type SubstatRollInfo = {
  key: DiscSubStatKey
  label: string
  totalRolls: number
  totalValue: number
  perRollValue: number
}

export type StatComparisonEntry = {
  key: string
  label: string
  current: number
  improved: number
  unit: string
  isPercent: boolean
}

export type TeammateInfo = {
  characterKey: CharacterKey
  wengineKey?: string
  discSetKeys: DiscSetKey[]
  mindscape: number
}

export type PerActionDamage = {
  name: string
  tag: Tag
  value: number
  calcResult: CalcResult<number, CalcMeta<Tag, string>>
  buffedStats: BuildCombatStats | null
}

export type TargetFormulaInfo = {
  frame: OptFrame
  formulaTag: Tag
  perActionDamage: PerActionDamage[]
  buffedStats: BuildCombatStats | null
}

export type AnalysisData = {
  selectedStats: BuildCombatStats | null
  equippedStats: BuildCombatStats | null
  targetValue: number
  selectedDiscSubstats: SubstatRollInfo[]
  teammates: TeammateInfo[]
  selectedDiscSetIds: string[]
  characterKey: CharacterKey
  selectedWengineKey?: string
  targetInfo: TargetFormulaInfo | null
}

export type StatContribution = {
  name: string
  key: string
  value: number
  color: string
  maxRef: number
}

export function buildAnalysisData(params: {
  selectedBuild: { wengineKey?: string; discIds: DiscIds; value: number }
  enrichedBuilds: EnrichedBuild[]
  equippedBuildId: string
  getDisc: (id: string) => ICachedDisc | undefined
  team: Team
  character: ICachedCharacter
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined
}): AnalysisData {
  const {
    selectedBuild,
    enrichedBuilds,
    equippedBuildId,
    getDisc,
    team,
    character,
    getTeammateChar,
  } = params

  const selectedId = `${selectedBuild.wengineKey ?? ''}-${Object.values(selectedBuild.discIds).join('-')}`
  const selectedEnriched =
    enrichedBuilds.find((b) => b.id === selectedId) ?? null
  const equippedEnriched =
    enrichedBuilds.find((b) => b.id === equippedBuildId) ?? null

  const selectedDiscSubstats = buildSubstatRolls(selectedBuild.discIds, getDisc)

  const teammates: TeammateInfo[] = team.teammates
    .filter((t: TeammateDatum) => t.characterKey !== character.key)
    .map((t: TeammateDatum) => {
      const teammateChar = getTeammateChar?.(t.characterKey)
      let discSetKeys: DiscSetKey[] = t.discSet4Key
        ? [t.discSet4Key as DiscSetKey]
        : []
      if (discSetKeys.length === 0 && teammateChar) {
        const setCounts = new Map<string, number>()
        for (const slotKey of Object.keys(
          teammateChar.equippedDiscs
        ) as DiscSlotKey[]) {
          const discId = teammateChar.equippedDiscs[slotKey]
          if (!discId) continue
          const disc = getDisc(discId)
          if (disc?.setKey) {
            setCounts.set(disc.setKey, (setCounts.get(disc.setKey) ?? 0) + 1)
          }
        }
        discSetKeys = Array.from(setCounts.entries())
          .filter(([_, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .map(([key]) => key as DiscSetKey)
      }
      return {
        characterKey: t.characterKey,
        wengineKey: teammateChar?.wengineKey,
        discSetKeys,
        mindscape: t.mindscape ?? teammateChar?.mindscape ?? 0,
      }
    })

  const targetInfo = buildTargetInfo(selectedBuild, getDisc, character, team)

  return {
    selectedStats:
      targetInfo?.buffedStats ?? selectedEnriched?.combatStats ?? null,
    equippedStats: equippedEnriched?.combatStats ?? null,
    targetValue: selectedBuild.value,
    selectedDiscSubstats,
    teammates,
    selectedDiscSetIds: selectedEnriched?.discSetIds ?? [],
    characterKey: character.key,
    selectedWengineKey: selectedBuild.wengineKey,
    targetInfo,
  }
}

function buildTargetInfo(
  selectedBuild: { wengineKey?: string; discIds: DiscIds },
  getDisc: (id: string) => ICachedDisc | undefined,
  character: ICachedCharacter,
  team: Team
): TargetFormulaInfo | null {
  const frame = getTeamFrame0(team)
  if (!frame.tag) return null

  const formulaTag = targetTag(frame.tag)

  const discEntries = Object.entries(selectedBuild.discIds).map(
    ([slot, id]) => {
      const disc = id ? getDisc(id) : undefined
      return [slot, disc] as const
    }
  )
  const discs = Object.fromEntries(discEntries) as Record<
    DiscSlotKey,
    ICachedDisc | undefined
  >

  const entries = buildCalculatorEntries(character, discs, team)
  const calc = zzzCalculatorWithEntries(entries)

  const combatReader = convert(ownTag, {
    et: 'own',
    src: character.key,
    preset: 'preset0',
  })

  const buffedStats: BuildCombatStats = {
    hp: calc.compute(combatReader.final.hp).val,
    atk: calc.compute(combatReader.final.atk).val,
    def: calc.compute(combatReader.final.def).val,
    impact: calc.compute(combatReader.final.impact).val,
    critRate: calc.compute(combatReader.final.crit_).val,
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

  const perActionDamage: PerActionDamage[] = []

  const readBuffedStats = (nameContext?: string): BuildCombatStats => {
    if (!nameContext) return buffedStats
    const s = (r: any) => calc.compute(r.with('name', nameContext as any)).val
    return {
      hp: s(combatReader.final.hp),
      atk: s(combatReader.final.atk),
      def: s(combatReader.final.def),
      impact: s(combatReader.final.impact),
      critRate: s(combatReader.final.crit_),
      critDmg: s(combatReader.final.crit_dmg_),
      penRatio: s(combatReader.final.pen_),
      pen: s(combatReader.final.pen),
      enerRegen: s(combatReader.final.enerRegen),
      anomProf: s(combatReader.final.anomProf),
      anomMas: s(combatReader.final.anomMas),
      sheerForce: s(combatReader.final.sheerForce),
      dmgBonus: s(combatReader.final.dmg_),
      defIgn: s(combatReader.final.defIgn_),
    }
  }

  if (frame.tag.rotation) {
    for (const action of frame.tag.rotation) {
      const actionTag = targetTag({ sheet: action.sheet, name: action.name })
      const targetRead = new Read(
        { src: character.key, ...actionTag },
        undefined
      ).with('preset', 'preset0' as any)
      const actionResult = calc.compute(targetRead)
      perActionDamage.push({
        name: `${action.sheet}.${action.name}`,
        tag: actionTag,
        value: actionResult.val,
        calcResult: actionResult,
        buffedStats: readBuffedStats(action.name),
      })
    }
  } else {
    const targetRead = new Read(
      { src: character.key, ...formulaTag },
      undefined
    ).with('preset', 'preset0' as any)
    const calcResult = calc.compute(targetRead)
    const value = calcResult.val
    const actionName = formulaTag.name ?? undefined
    perActionDamage.push({
      name:
        frame.tag.sheet && frame.tag.name
          ? `${frame.tag.sheet}.${frame.tag.name}`
          : frame.tag.q && frame.tag.qt
            ? `${frame.tag.q} (${frame.tag.qt})`
            : 'Target',
      tag: formulaTag,
      value,
      calcResult,
      buffedStats: readBuffedStats(actionName),
    })
  }

  return {
    frame,
    formulaTag,
    perActionDamage,
    buffedStats,
  }
}

function buildSubstatRolls(
  discIds: DiscIds,
  getDisc: (id: string) => ICachedDisc | undefined
): SubstatRollInfo[] {
  const rollMap = new Map<DiscSubStatKey, { rolls: number; value: number }>()

  for (const id of Object.values(discIds)) {
    if (!id) continue
    const disc = getDisc(id)
    if (!disc) continue

    for (const sub of disc.substats as ISubstat[]) {
      if (!sub.key || sub.upgrades === 0) continue
      const key = sub.key as DiscSubStatKey
      const existing = rollMap.get(key)
      const rollValue = getDiscSubStatBaseVal(key, disc.rarity)
      if (existing) {
        existing.rolls += sub.upgrades
        existing.value += rollValue * sub.upgrades
      } else {
        rollMap.set(key, {
          rolls: sub.upgrades,
          value: rollValue * sub.upgrades,
        })
      }
    }
  }

  return Array.from(rollMap.entries())
    .map(([key, { rolls, value }]) => ({
      key,
      label: statKeyTextMap[key] ?? key,
      totalRolls: rolls,
      totalValue: value,
      perRollValue: getDiscSubStatBaseVal(key, 'S'),
    }))
    .sort((a, b) => b.totalRolls - a.totalRolls)
}

export function buildStatContributions(
  stats: BuildCombatStats
): StatContribution[] {
  return [
    {
      name: 'ATK',
      key: 'atk',
      value: stats.atk,
      color: '#4dabf7',
      maxRef: stats.atk,
    },
    {
      name: 'DMG%',
      key: 'dmgBonus',
      value: stats.dmgBonus * 100,
      color: '#fcc419',
      maxRef: 100,
    },
    {
      name: 'CRIT Rate',
      key: 'critRate',
      value: stats.critRate * 100,
      color: '#ff6b6b',
      maxRef: 100,
    },
    {
      name: 'CRIT DMG',
      key: 'critDmg',
      value: stats.critDmg * 100,
      color: '#38d9a9',
      maxRef: 200,
    },
    {
      name: 'PEN Ratio',
      key: 'penRatio',
      value: stats.penRatio * 100,
      color: '#da77f2',
      maxRef: 100,
    },
    {
      name: 'Impact',
      key: 'impact',
      value: stats.impact,
      color: '#ff922b',
      maxRef: stats.impact,
    },
  ]
}

const STAT_COMPARE_CONFIG: Array<{
  key: keyof BuildCombatStats
  label: string
  isPercent: boolean
}> = [
  { key: 'atk', label: 'ATK', isPercent: false },
  { key: 'hp', label: 'HP', isPercent: false },
  { key: 'def', label: 'DEF', isPercent: false },
  { key: 'impact', label: 'Impact', isPercent: false },
  { key: 'critRate', label: 'CRIT Rate', isPercent: true },
  { key: 'critDmg', label: 'CRIT DMG', isPercent: true },
  { key: 'penRatio', label: 'PEN Ratio', isPercent: true },
  { key: 'pen', label: 'PEN', isPercent: false },
  { key: 'dmgBonus', label: 'DMG Bonus', isPercent: true },
  { key: 'enerRegen', label: 'Energy Regen', isPercent: false },
  { key: 'anomProf', label: 'Anomaly Prof.', isPercent: false },
  { key: 'anomMas', label: 'Anomaly Mastery', isPercent: false },
  { key: 'defIgn', label: 'DEF Ignore', isPercent: true },
]

export function buildStatComparisons(
  equipped: BuildCombatStats | null,
  selected: BuildCombatStats | null
): StatComparisonEntry[] {
  if (!equipped || !selected) return []
  return STAT_COMPARE_CONFIG.map(({ key, label, isPercent }) => {
    const unit = isPercent ? '%' : ''
    return {
      key,
      label,
      current: equipped[key],
      improved: selected[key],
      unit,
      isPercent,
    }
  })
}
