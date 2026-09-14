import { Box, Button, Divider, Group, Menu, Stack, Text } from '@mantine/core'
import {
  ColorText,
  DropdownButton,
  SqBadge,
} from '@zenless-optimizer/common/ui'
import { useCallback, useMemo } from 'react'
import type { ComboKindKey, TargetTag } from '../db'
import {
  comboKindKeys,
  getTeamFrame0,
  type ICachedCharacter,
  isComboTarget,
  type Team,
  targetTag,
} from '../db'
import { useDatabaseContext } from '../db-ui'
import type { Tag } from '../formula'
import { own } from '../formula'
import {
  damageTypeKeysMap,
  getDmgType,
  getVariant,
  useZzzCalcContext,
} from '../formula-ui'
import { getCharStat } from '../stats'
import { AttributeName } from '../ui'
import {
  OptTargetTagDisplay,
  parseSkillVariant,
  type SkillVariantKind,
  skillBadges,
  skillVariantBase,
} from './OptTargetTagDisplay'

const statTargets = [
  own.final.atk,
  own.final.hp,
  own.final.def,
  own.final.enerRegen,
  own.final.anomProf,
  own.final.anomMas,
] as const

interface DmgCategory {
  key: string
  label: string
  matchTypes: string[]
}

const dmgCategories: DmgCategory[] = [
  { key: 'basic', label: 'Basic', matchTypes: ['basic'] },
  { key: 'dodge', label: 'Dodge', matchTypes: ['dash', 'dodgeCounter'] },
  { key: 'special', label: 'Special', matchTypes: ['special', 'exSpecial'] },
  { key: 'chain', label: 'Chain', matchTypes: ['chain', 'ult'] },
  {
    key: 'assist',
    label: 'Assist',
    matchTypes: [
      'entrySkill',
      'quickAssist',
      'defensiveAssist',
      'evasiveAssist',
      'assistFollowUp',
      'counterAssist',
    ],
  },
]

function getFormulaCategory(tag: Tag): string {
  // Use the raw damageType1 first so Daze/Buildup variants (whose q is not a
  // dmg type and hence invisible to getDmgType) land in the same category as
  // their DMG counterpart instead of "other".
  const rawDamageType = tag.damageType1
  if (rawDamageType) {
    for (const cat of dmgCategories) {
      if (cat.matchTypes.includes(rawDamageType)) return cat.key
    }
  }
  const dmgTypes = getDmgType(tag)
  for (const cat of dmgCategories) {
    if (dmgTypes.some((dt) => cat.matchTypes.includes(dt))) return cat.key
  }
  return 'other'
}

type SkillVariantEntry = { tag: Tag; kind: SkillVariantKind }

type CategoryEntry =
  | { type: 'group'; key: string; base: string; variants: SkillVariantEntry[] }
  | { type: 'single'; tag: Tag }

const variantOrder: Record<SkillVariantKind, number> = {
  dmg: 0,
  daze: 1,
  anomBuildup: 2,
  gashBuildup: 2,
}

function variantPillLabel(kind: SkillVariantKind): string {
  switch (kind) {
    case 'dmg':
      return 'DMG'
    case 'daze':
      return 'Daze'
    case 'anomBuildup':
    case 'gashBuildup':
      return 'Buildup'
  }
}

/** Short metric name for a combo kind (`dmg` → `DMG`). */
export function comboMetricLabel(kind: ComboKindKey): string {
  switch (kind) {
    case 'dmg':
      return 'DMG'
    case 'daze':
      return 'Daze'
    case 'buildup':
      return 'Buildup'
  }
}

/** Opt-target label for a combo metric (`dmg` → `Combo DMG`). */
export function comboKindLabel(kind: ComboKindKey): string {
  return `Combo ${comboMetricLabel(kind)}`
}

/** Element suffix of shared anomaly vortex targets (`vortexDmgInst_fire` → `fire`). */
function vortexSuffix(tag: Tag): string | undefined {
  if (tag.sheet !== 'agg' || typeof tag.name !== 'string') return undefined
  return tag.name.match(/^vortexDmgInst_(.+)$/)?.[1]
}

export function OptTargetSelector({
  character: { key: characterKey },
  team,
}: {
  team: Team
  character: ICachedCharacter
}) {
  const { tag: target } = getTeamFrame0(team)
  const calc = useZzzCalcContext()
  const { database } = useDatabaseContext()
  const tag = useMemo(() => {
    if (!target) return undefined
    return targetTag(target)
  }, [target])

  const formulaOptions = useMemo(() => {
    if (!calc) return []
    return calc.listFormulas(own.listing.formulas)
  }, [calc])

  // Picking a single target stages (but preserves) any stored rotation —
  // the combo card stays editable and the rotation resumes when a Combo
  // metric is selected again.
  const handleFormulaSelect = useCallback(
    (sheet: string, name: string) => {
      database.teams.setFrame0(characterKey, (frame) => ({
        tag: {
          ...frame.tag,
          sheet,
          name,
          damageType1: undefined,
          damageType2: undefined,
          q: undefined,
          qt: undefined,
        },
      }))
    },
    [database, characterKey]
  )

  const handleStatSelect = useCallback(
    (q: string, qt: string) => {
      database.teams.setFrame0(characterKey, (frame) => ({
        tag: {
          ...frame.tag,
          q: q as TargetTag['q'],
          qt: qt as 'final',
          sheet: undefined,
          name: undefined,
          damageType1: undefined,
          damageType2: undefined,
        },
      }))
    },
    [database, characterKey]
  )

  // A rotation target means the optimizer sums the combo hits. It has no
  // sheet/name of its own, so it is represented as explicit Combo entries
  // in the Other category — one per metric (DMG/Daze/Buildup). Each hit is
  // stored once (ability+hit) and the selected kind picks which per-hit
  // variant (`_dmg` / `_daze` / `_anomBuildup`) is summed. Selecting a Combo
  // metric activates a staged rotation; the single target is cleared.
  const rotation = target?.rotation
  const rotationCount = rotation?.length ?? 0
  const isRotation = isComboTarget(target)
  const comboKind: ComboKindKey = target?.comboKind ?? 'dmg'

  const handleComboSelect = useCallback(
    (kind: ComboKindKey) => {
      // Already targeting this combo metric.
      if (isRotation && comboKind === kind) return
      // Convert the current single-formula target into a 1-hit rotation so
      // no configured target is lost. Otherwise seed from the first formula.
      const seed =
        target?.sheet && target?.name
          ? { sheet: target.sheet, name: target.name }
          : (() => {
              const first = formulaOptions.find(
                ({ tag: ftag }) => ftag.sheet && ftag.name
              )?.tag
              return first?.sheet && first?.name
                ? { sheet: first.sheet, name: first.name }
                : undefined
            })()
      database.teams.setFrame0(characterKey, (frame) => {
        const prevRotation = frame.tag?.rotation
        const nextRotation = prevRotation ?? (seed ? [seed] : undefined)
        if (!nextRotation || nextRotation.length === 0) return false
        return {
          tag: {
            ...frame.tag,
            rotation: nextRotation,
            sheet: undefined,
            name: undefined,
            damageType1: undefined,
            damageType2: undefined,
            q: undefined,
            qt: undefined,
            comboKind: kind === 'dmg' ? undefined : kind,
          },
        }
      })
    },
    [database, characterKey, isRotation, comboKind, target, formulaOptions]
  )

  // Determine which category has the active selection
  const activeCategory = useMemo(() => {
    if (!tag) return undefined
    if (isRotation) return 'other'
    return getFormulaCategory(tag)
  }, [tag, isRotation])

  // Group formulas by damage type category, combining the DMG / Daze /
  // Buildup variants of each attack (ability + hit) into a single entry so
  // each row reads "{attack name} DMG | Daze | Buildup".
  // Shared anomaly vortex targets are filtered to the character's element
  // (wind/lumiflux keep all; Miyabi sees frost instead of ice).
  const categorizedEntries = useMemo(() => {
    const map: Record<string, CategoryEntry[]> = {
      basic: [],
      dodge: [],
      special: [],
      chain: [],
      assist: [],
      other: [],
    }
    const attribute = getCharStat(characterKey).attribute
    const expectedVortex =
      attribute === 'wind' || attribute === 'lumiflux'
        ? undefined
        : characterKey === 'Miyabi'
          ? 'frost'
          : attribute
    const groupIndex: Record<string, Record<string, number>> = {}
    for (const { tag: ftag } of formulaOptions) {
      const { name, sheet } = ftag
      if (!name || !sheet) continue
      const suffix = vortexSuffix(ftag)
      if (suffix && expectedVortex && suffix !== expectedVortex) continue
      const cat = getFormulaCategory(ftag)
      const parsed = parseSkillVariant(ftag)
      if (!parsed) {
        map[cat].push({ type: 'single', tag: ftag })
        continue
      }
      const groupKey = `${sheet}_${parsed.abilityKey}_${parsed.hitIdx}`
      const idx = groupIndex[cat]?.[groupKey]
      if (idx === undefined) {
        ;(groupIndex[cat] ??= {})[groupKey] = map[cat].length
        map[cat].push({
          type: 'group',
          key: groupKey,
          base: skillVariantBase(ftag) ?? parsed.abilityKey,
          variants: [{ tag: ftag, kind: parsed.kind }],
        })
      } else {
        const entry = map[cat][idx]
        if (entry.type === 'group')
          entry.variants.push({ tag: ftag, kind: parsed.kind })
      }
    }
    for (const entries of Object.values(map))
      for (const entry of entries)
        if (entry.type === 'group')
          entry.variants.sort(
            (a, b) => variantOrder[a.kind] - variantOrder[b.kind]
          )
    return map
  }, [formulaOptions, characterKey])

  // Check if a formula tag matches the currently active target
  const isFormulaActive = useCallback(
    (ftag: Tag): boolean => {
      if (!tag) return false
      return tag.sheet === ftag.sheet && tag.name === ftag.name
    },
    [tag]
  )

  // Check if a stat tag matches the currently active target
  const isStatActive = useCallback(
    (st: (typeof statTargets)[number]): boolean => {
      if (!tag || isRotation) return false
      return tag.q === st.tag.q && tag.qt === st.tag.qt
    },
    [tag, isRotation]
  )

  // Render a menu item for a formula
  const renderFormulaItem = useCallback(
    (ftag: Tag) => {
      const { name, sheet } = ftag
      if (!name || !sheet) return null
      return (
        <Menu.Item
          key={`${sheet}_${name}`}
          onClick={() => handleFormulaSelect(sheet, name)}
          style={{ fontWeight: isFormulaActive(ftag) ? 'bold' : undefined }}
        >
          <Box style={{ display: 'flex', gap: 4 }}>
            <OptTargetTagDisplay tag={ftag} />
          </Box>
        </Menu.Item>
      )
    },
    [handleFormulaSelect, isFormulaActive]
  )

  // Render a grouped "{attack name} DMG | Daze | Buildup" row: colored name +
  // badges in the first column, variant pills in the second column.
  const renderGroupEntry = useCallback(
    (entry: Extract<CategoryEntry, { type: 'group' }>) => {
      const anyActive = entry.variants.some(({ tag: vtag }) =>
        isFormulaActive(vtag)
      )
      const repTag =
        entry.variants.find(({ kind }) => kind === 'dmg')?.tag ??
        entry.variants[0].tag
      const badges = skillBadges(repTag)
      return (
        <Box key={entry.key} px={10} py={6}>
          <Group gap="xs" wrap="nowrap" align="center">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <ColorText color={getVariant(repTag)}>
                <Text fw={anyActive ? 'bold' : undefined} component="span">
                  {entry.base}
                </Text>
              </ColorText>
            </Box>
            <Box
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {badges.map((dmgType) => (
                <SqBadge key={dmgType}>{damageTypeKeysMap[dmgType]}</SqBadge>
              ))}
              {repTag.attribute && (
                <SqBadge color={repTag.attribute}>
                  {<AttributeName attribute={repTag.attribute} />}
                </SqBadge>
              )}
            </Box>
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              {entry.variants.map(({ tag: vtag, kind }) => {
                const { name, sheet } = vtag
                if (!name || !sheet) return null
                const active = isFormulaActive(vtag)
                return (
                  <Button
                    key={`${sheet}_${name}`}
                    size="compact-xs"
                    variant="filled"
                    styles={{
                      root: {
                        backgroundColor: active ? '#214886' : '#1E2C4B',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: active ? '#2b56a3' : '#27395c',
                        },
                      },
                    }}
                    onClick={() => handleFormulaSelect(sheet, name)}
                  >
                    {variantPillLabel(kind)}
                  </Button>
                )
              })}
            </Group>
          </Group>
        </Box>
      )
    },
    [handleFormulaSelect, isFormulaActive]
  )

  // Render a category-specific dropdown button
  const renderCategoryButton = useCallback(
    (cat: DmgCategory) => {
      const entries = categorizedEntries[cat.key]
      const isActive = activeCategory === cat.key

      return (
        <DropdownButton
          key={cat.key}
          color={isActive ? 'green' : 'yellow.8'}
          variant={isActive ? 'outline' : undefined}
          title={
            isActive && tag ? (
              <Box style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <OptTargetTagDisplay tag={tag} />
              </Box>
            ) : (
              cat.label
            )
          }
          style={{ width: '100%' }}
        >
          {entries.length > 0 && (
            <>
              <Menu.Label>{cat.label}</Menu.Label>
              {entries.map((entry) =>
                entry.type === 'group'
                  ? renderGroupEntry(entry)
                  : renderFormulaItem(entry.tag)
              )}
            </>
          )}
        </DropdownButton>
      )
    },
    [
      categorizedEntries,
      activeCategory,
      tag,
      renderFormulaItem,
      renderGroupEntry,
    ]
  )

  return (
    <Stack gap="xs">
      {dmgCategories.map(renderCategoryButton)}
      <DropdownButton
        color={activeCategory === 'other' ? 'green' : 'yellow.8'}
        variant={activeCategory === 'other' ? 'outline' : undefined}
        title={
          activeCategory === 'other' && tag ? (
            <Box style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {isRotation ? (
                <Text fw="bold" component="span">
                  {comboKindLabel(comboKind)} ({rotationCount})
                </Text>
              ) : (
                <OptTargetTagDisplay tag={tag} />
              )}
            </Box>
          ) : (
            'Other'
          )
        }
        style={{ width: '100%' }}
      >
        <Menu.Label>Combo</Menu.Label>
        {comboKindKeys.map((kind) => {
          const active = isRotation && comboKind === kind
          return (
            <Menu.Item
              key={kind}
              onClick={() => handleComboSelect(kind)}
              style={{ fontWeight: active ? 'bold' : undefined }}
            >
              <Box style={{ display: 'flex', gap: 4 }}>
                <Text component="span">
                  {comboKindLabel(kind)}
                  {active ? ` (${rotationCount} hits)` : ''}
                </Text>
              </Box>
            </Menu.Item>
          )
        })}
        <Divider />
        <Menu.Label>Stats</Menu.Label>
        {statTargets.map((st, i) => {
          const { q, qt } = st.tag
          if (!q || !qt) return null
          return (
            <Menu.Item
              key={`stat_${i}_${q}_${qt}`}
              onClick={() => handleStatSelect(q, qt)}
              style={{ fontWeight: isStatActive(st) ? 'bold' : undefined }}
            >
              <Box style={{ display: 'flex', gap: 4 }}>
                <OptTargetTagDisplay tag={st.tag} />
              </Box>
            </Menu.Item>
          )
        })}
        {categorizedEntries.other.length > 0 && (
          <>
            <Divider />
            <Menu.Label>Other DMG</Menu.Label>
            {categorizedEntries.other.map((entry) =>
              entry.type === 'group'
                ? renderGroupEntry(entry)
                : renderFormulaItem(entry.tag)
            )}
          </>
        )}
      </DropdownButton>
    </Stack>
  )
}
