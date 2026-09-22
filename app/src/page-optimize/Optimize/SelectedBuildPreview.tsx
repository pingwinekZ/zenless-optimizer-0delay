import { Box, Button, Flex, Stack, Text } from '@mantine/core'
import type {
  CharacterKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'
import {
  allDiscSlotKeys,
  getDiscSubStatBaseVal,
} from '@zenless-optimizer/zzz/consts'
import type {
  BuildRecipe,
  DiscIds,
  GeneratedBuild,
  ICachedDisc,
} from '@zenless-optimizer/zzz/db'
import { useDatabaseContext, useDiscs } from '@zenless-optimizer/zzz/db-ui'
import { useDiscEditorModalStore } from '@zenless-optimizer/zzz/ui'
import {
  DiscSet2p,
  DiscSetName,
} from '@zenless-optimizer/zzz/ui/Disc/DiscTrans'
import { useCallback, useMemo } from 'react'
import { ShowcaseDiscCard } from '../../page-characters'
import { discCardH, discCardW } from '../../page-characters/constantsUi'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from '../../page-discs/scoring/statWeightUtils'

/**
 * Renders the 6 showcase-style disc cards in a single horizontal row
 * for a selected build's discIds.
 * Clicking a disc opens the disc editor modal.
 * Extracted as a separate component so the `useDiscs` hook is always
 * called unconditionally (Rules of Hooks).
 */
/**
 * Renders the 6 showcase-style disc cards in a single horizontal row
 * for a selected build's discIds.
 * Clicking a disc opens the disc editor modal.
 */
export function SelectedBuildDiscs({
  discIds,
  characterKey,
  theoreticalDiscMap,
}: {
  discIds: DiscIds
  characterKey: CharacterKey
  theoreticalDiscMap?: Record<string, ICachedDisc>
}) {
  const dbDiscs = useDiscs(discIds)
  const { database } = useDatabaseContext()
  const effectiveStats = useMemo(
    () => getMergedEffectiveStats(characterKey, database),
    [characterKey, database]
  )
  const substatWeights = useMemo(
    () => getMergedSubstatWeights(characterKey, database),
    [characterKey, database]
  )
  const openEditorModal = useDiscEditorModalStore((s) => s.openOverlay)

  const discs = useMemo(() => {
    if (!theoreticalDiscMap) return dbDiscs
    return Object.fromEntries(
      allDiscSlotKeys.map((slot) => {
        const id = discIds[slot]
        if (id && theoreticalDiscMap[id]) return [slot, theoreticalDiscMap[id]]
        return [slot, dbDiscs[slot]]
      })
    ) as Record<DiscSlotKey, ICachedDisc | undefined>
  }, [dbDiscs, discIds, theoreticalDiscMap])

  const handleDiscClick = useCallback(
    (slot: DiscSlotKey) => {
      const disc = discs[slot]
      openEditorModal({
        selectedDisc: disc ?? null,
        slotKey: slot,
        characterKey,
        onOk: () => {},
      })
    },
    [discs, openEditorModal, characterKey]
  )

  return (
    <Flex
      gap={6}
      wrap="nowrap"
      style={
        {
          '--showcase-card-bg': 'var(--mantine-color-dark-6)',
          '--showcase-card-border': 'rgba(255, 255, 255, 0.1)',
          '--showcase-shadow': 'rgba(0, 0, 0, 0.25) 0px 2px 16px',
          '--showcase-shadow-inset':
            ', inset rgba(255, 255, 255, 0.1) 0px 0px 2px',
        } as any
      }
    >
      {allDiscSlotKeys.map((slotKey) => (
        <ShowcaseDiscCard
          key={slotKey}
          slot={slotKey}
          disc={discs[slotKey]}
          onClick={() => handleDiscClick(slotKey)}
          effectiveStats={effectiveStats}
          substatWeights={substatWeights}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: `${discCardW} / ${discCardH}`,
          }}
        />
      ))}
    </Flex>
  )
}

/**
 * Aggregate summary card for theoretical max builds.
 * Shows total substat rolls and main stat selections across all 6 discs,
 * using the recipe's metadata (total rolls per substat across all discs)
 * instead of per-disc substat arrays (which can't capture all substat
 * types when different discs have different sets).
 */
export function TheoreticalBuildSummary({
  recipeId,
  recipeMeta,
  theoreticalDiscMap,
  value,
  isPinned,
  pinnedRecipeId,
  onPinReference,
}: {
  recipeId: string
  recipeMeta?: BuildRecipe
  theoreticalDiscMap: Record<string, ICachedDisc>
  value: number
  isPinned: boolean
  pinnedRecipeId?: string
  onPinReference: (build?: GeneratedBuild) => void
}) {
  const allDiscs = allDiscSlotKeys
    .map((sk) => theoreticalDiscMap[`${recipeId}_${sk}`])
    .filter(Boolean) as ICachedDisc[]

  // Collect main stat per slot
  const mainStatBySlot: Record<DiscSlotKey, string> = {} as Record<
    DiscSlotKey,
    string
  >
  for (const d of allDiscs) {
    mainStatBySlot[d.slotKey] = d.mainStatKey
  }

  // Use recipe metadata totalRolls for aggregate display
  const substatEntries = recipeMeta
    ? Object.entries(recipeMeta.totalRolls)
        .filter(([, rolls]) => (rolls ?? 0) > 0)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    : []
  // Only the exact pinned recipe counts as pinned — value ties (e.g. crit_
  // vs crit_dmg_ mains) surface sibling builds that must stay pinnable.
  const isThisPinned = isPinned && pinnedRecipeId === recipeId

  return (
    <Box p="sm">
      <Flex align="center" justify="space-between" gap="xs" mb="xs">
        <Text size="lg" fw={700} c="yellow">
          Build Value: {Math.floor(value).toLocaleString()}
        </Text>
        <Button
          size="xs"
          variant={isThisPinned ? 'filled' : 'default'}
          disabled={isThisPinned}
          onClick={() => onPinReference()}
          title={
            isThisPinned
              ? 'This build is the pinned reference for this character'
              : isPinned
                ? 'This character already has a pinned reference — pinning this build replaces it'
                : 'Pin this theoretical build as this character\u2019s perfect reference for future comparisons'
          }
        >
          {isThisPinned ? 'Reference pinned' : 'Pin as reference'}
        </Button>
      </Flex>

      <Text size="sm" fw={600} mt="sm" mb={4}>
        Main Stats
      </Text>
      <Flex gap="xs" wrap="wrap">
        {allDiscSlotKeys.map((sk) => (
          <Text key={sk} size="xs" c="dimmed">
            Slot {sk}: {statMainLabel(mainStatBySlot[sk] ?? '')}
          </Text>
        ))}
      </Flex>

      <Text size="sm" fw={600} mt="sm" mb={4}>
        Total Substats (across all 6 discs)
      </Text>
      <Flex gap="xs" wrap="wrap">
        {substatEntries.length > 0 ? (
          substatEntries.map(([key, totalRolls]) => {
            const perRoll = getDiscSubStatBaseVal(key as DiscSubStatKey, 'S')
            const totalVal = perRoll * (totalRolls ?? 0)
            // Percentage substats: hp_, atk_, def_, crit_, crit_dmg_, pen_
            const isPercent = [
              'hp_',
              'atk_',
              'def_',
              'crit_',
              'crit_dmg_',
              'pen_',
            ].includes(key)
            const formatted = isPercent
              ? (totalVal * 100).toFixed(1) + '%'
              : Math.round(totalVal).toString()
            return (
              <Text key={key} size="xs">
                {statShortLabel(key)}: {formatted} ({totalRolls} roll
                {totalRolls !== 1 ? 's' : ''})
              </Text>
            )
          })
        ) : (
          <Text size="xs" c="dimmed">
            Value: {Math.floor(value).toLocaleString()}
          </Text>
        )}
      </Flex>

      {recipeMeta && (
        <>
          <Text size="sm" fw={600} mt="sm" mb={4}>
            Sets
          </Text>
          <Stack gap={4}>
            {/* 4-Piece set */}
            <Flex gap="xs" align="center">
              <Text size="xs" fw={500}>
                <DiscSetName setKey={recipeMeta.set4} />
              </Text>
              <Text size="xs" c="dimmed">
                4pc
              </Text>
            </Flex>
            {/* 2-Piece set */}
            {recipeMeta.set4 !== recipeMeta.set2 && (
              <Flex gap="xs">
                <Text size="xs" c="dimmed">
                  2pc:
                </Text>
                <Text size="xs">
                  <DiscSet2p setKey={recipeMeta.set2} />
                </Text>
              </Flex>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

function statMainLabel(key: string): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'ATK',
    def: 'DEF',
    hp_: 'HP%',
    atk_: 'ATK%',
    def_: 'DEF%',
    crit_: 'CRIT Rate',
    crit_dmg_: 'CRIT DMG',
    pen_: 'PEN Ratio',
    anomProf: 'Anom Prof',
    anomMas_: 'Anom Mas',
    impact_: 'Impact',
    enerRegen_: 'Energy Regen',
    physical_dmg_: 'Phys DMG',
    fire_dmg_: 'Fire DMG',
    ice_dmg_: 'Ice DMG',
    electric_dmg_: 'Elec DMG',
    ether_dmg_: 'Ether DMG',
    wind_dmg_: 'Wind DMG',
  }
  return labels[key] ?? key
}

function statShortLabel(key: string): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'ATK',
    def: 'DEF',
    hp_: 'HP%',
    atk_: 'ATK%',
    def_: 'DEF%',
    crit_: 'CR',
    crit_dmg_: 'CD',
    pen: 'PEN',
    anomProf: 'AP',
  }
  return labels[key] ?? key
}
