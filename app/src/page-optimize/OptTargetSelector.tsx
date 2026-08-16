import { Box, Divider, Menu, Stack } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useCallback, useMemo } from 'react'
import type { TargetTag } from '../db'
import {
  getTeamFrame0,
  type ICachedCharacter,
  type Team,
  targetTag,
} from '../db'
import { useDatabaseContext } from '../db-ui'
import type { Tag } from '../formula'
import { own } from '../formula'
import { FullTagDisplay, getDmgType, useZzzCalcContext } from '../formula-ui'

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
    ],
  },
]

function getFormulaCategory(tag: Tag): string {
  const dmgTypes = getDmgType(tag)
  for (const cat of dmgCategories) {
    if (dmgTypes.some((dt) => cat.matchTypes.includes(dt))) return cat.key
  }
  return 'other'
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

  const handleFormulaSelect = useCallback(
    (sheet: string, name: string) => {
      database.teams.setFrame0(characterKey, { tag: { sheet, name } })
    },
    [database, characterKey]
  )

  const handleStatSelect = useCallback(
    (q: string, qt: string) => {
      database.teams.setFrame0(characterKey, {
        tag: { q: q as TargetTag['q'], qt: qt as 'final' },
      })
    },
    [database, characterKey]
  )

  // Determine which category has the active selection
  const activeCategory = useMemo(() => {
    if (!tag) return undefined
    return getFormulaCategory(tag)
  }, [tag])

  // Group formulas by damage type category
  const categorizedFormulas = useMemo(() => {
    const map: Record<string, Tag[]> = {
      basic: [],
      dodge: [],
      special: [],
      chain: [],
      assist: [],
      other: [],
    }
    for (const { tag: ftag } of formulaOptions) {
      const { name, sheet } = ftag
      if (!name || !sheet) continue
      const cat = getFormulaCategory(ftag)
      map[cat].push(ftag)
    }
    return map
  }, [formulaOptions])

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
      if (!tag) return false
      return tag.q === st.tag.q && tag.qt === st.tag.qt
    },
    [tag]
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
            <FullTagDisplay tag={ftag} />
          </Box>
        </Menu.Item>
      )
    },
    [handleFormulaSelect, isFormulaActive]
  )

  // Render a category-specific dropdown button
  const renderCategoryButton = useCallback(
    (cat: DmgCategory) => {
      const formulas = categorizedFormulas[cat.key]
      const isActive = activeCategory === cat.key

      return (
        <DropdownButton
          key={cat.key}
          color={isActive ? 'green' : 'yellow.8'}
          variant={isActive ? 'outline' : undefined}
          title={
            isActive && tag ? (
              <Box style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <FullTagDisplay tag={tag} />
              </Box>
            ) : (
              cat.label
            )
          }
          style={{ width: '100%' }}
        >
          {formulas.length > 0 && (
            <>
              <Menu.Label>{cat.label}</Menu.Label>
              {formulas.map(renderFormulaItem)}
            </>
          )}
        </DropdownButton>
      )
    },
    [categorizedFormulas, activeCategory, tag, renderFormulaItem]
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
              <FullTagDisplay tag={tag} />
            </Box>
          ) : (
            'Other'
          )
        }
        style={{ width: '100%' }}
      >
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
                <FullTagDisplay tag={st.tag} />
              </Box>
            </Menu.Item>
          )
        })}
        {categorizedFormulas.other.length > 0 && (
          <>
            <Divider />
            <Menu.Label>Other DMG</Menu.Label>
            {categorizedFormulas.other.map(renderFormulaItem)}
          </>
        )}
      </DropdownButton>
    </Stack>
  )
}
