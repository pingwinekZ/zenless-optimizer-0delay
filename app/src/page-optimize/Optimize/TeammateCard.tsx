import {
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { characterAsset, discDefIcon, wengineAsset } from '../../assets'
import type {
  CharacterKey,
  DiscSetKey,
  PhaseKey,
  WengineKey,
} from '../../consts'
import { allPhaseKeys } from '../../consts'
import type { TeammateDatum } from '../../db'
import {
  useCharacter,
  useCharacterContext,
  useDatabaseContext,
  useDiscSets,
  useDiscs,
} from '../../db-ui'
import { buffs } from '../../formula'
import { charSheets, discUiSheets } from '../../formula-ui'
import {
  CharacterName,
  CharacterSingleSelectionModal,
  DiscSetName,
  WengineName,
  WengineSelectionModal,
} from '../../ui'
import { CharacterBuildSelector } from './CharacterBuildSelector'
import { CharacterConditionalsDisplay } from './CharacterConditionalsDisplay'
import { DiscConditionalsDisplay } from './DiscConditionalsDisplay'
import classes from './TeammateCard.module.css'
import { WEngineConditionalsDisplay } from './WEngineConditionalsDisplay'

const MINDSCAPE_OPTIONS = Array.from({ length: 7 }, (_, i) => ({
  value: String(i),
  label: String(i),
}))

const PHASE_OPTIONS = allPhaseKeys.map((p) => ({
  value: String(p),
  label: String(p),
}))

export function TeammateCard({
  slotIndex,
  characterKey,
  teammateDatum,
  showCharPassives,
  showWenginePassives,
}: {
  slotIndex: number
  characterKey: CharacterKey | undefined
  teammateDatum?: TeammateDatum
  showCharPassives: boolean
  showWenginePassives: boolean
}) {
  const mainChar = useCharacterContext()!
  const { database } = useDatabaseContext()
  const [showCharModal, onShowCharModal, onHideCharModal] = useBoolState()
  const [showWengineModal, onShowWengineModal, onHideWengineModal] =
    useBoolState()

  // Deferred teammate selection: save the selection, close the modal first,
  // then apply the DB mutation. This avoids a race where the database mutation
  // triggers a synchronous re-render (via useSyncExternalStore) before the
  // modal's show state has flushed, keeping the modal open.
  const pendingTeammateRef = useRef<CharacterKey | null | undefined>(undefined)
  const hasPendingTeammate = useRef(false)
  useEffect(() => {
    if (showCharModal || !hasPendingTeammate.current) return
    hasPendingTeammate.current = false
    const ck = pendingTeammateRef.current
    pendingTeammateRef.current = undefined
    if (ck) database.teams.setTeammate(mainChar.key, ck, slotIndex)
    else database.teams.setTeammate(mainChar.key, null, slotIndex)
  }, [showCharModal, database.teams, mainChar.key, slotIndex])

  const onCharSelect = useCallback(
    (ck: CharacterKey | null) => {
      pendingTeammateRef.current = ck
      hasPendingTeammate.current = true
      onHideCharModal()
    },
    [onHideCharModal]
  )

  const teammate = useCharacter(characterKey)
  const teammateWengineKey: WengineKey | '' = teammate?.wengineKey || ''
  const effectiveMindscape =
    teammateDatum?.mindscape ?? teammate?.mindscape ?? 0
  const effectiveWenginePhase =
    teammateDatum?.wenginePhase ?? teammate?.wenginePhase ?? 1

  // Get teammate's equipped discs and compute active set bonuses
  const teammateDiscs = useDiscs(teammate?.equippedDiscs)
  const activeSets = useDiscSets(teammateDiscs)
  const hasDiscInfo = Object.keys(activeSets).length > 0
  const hasDiscConditionals = useMemo(() => {
    // A 4p set implies the 2p effect is also active, so include both blocks
    // when scanning for conditionals. Only the matching block's conditionals
    // are shown — e.g. a 4p effect's conditional only appears when 4p is
    // actually equipped, not when only 2p of that set is active.
    return Object.entries(activeSets).some(([setKey, count]) => {
      const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
      return blocksToScan.some((blockKey) => {
        const block = discUiSheets[setKey as DiscSetKey]?.[blockKey]
        return block?.documents.some(
          (doc) => doc.type === 'conditional' && !!doc.conditional
        )
      })
    })
  }, [activeSets])

  const setMindscape = useCallback(
    (val: number) => {
      if (!characterKey) return
      database.teams.setTeammateOverride(mainChar.key, characterKey, {
        mindscape: val,
      })
    },
    [characterKey, database.teams, mainChar.key]
  )

  const setPhase = useCallback(
    (val: PhaseKey) => {
      if (!characterKey) return
      database.teams.setTeammateOverride(mainChar.key, characterKey, {
        wenginePhase: val,
      })
    },
    [characterKey, database.teams, mainChar.key]
  )

  const setWengineKey = useCallback(
    (wKey: WengineKey | '') => {
      if (!characterKey) return
      database.chars.getOrCreate(characterKey)
      database.chars.set(characterKey, {
        wengineKey: wKey,
      })
    },
    [characterKey, database.chars]
  )

  // Build conditional → fields map from formula-ui sheet
  // Only include team-wide buffs (team: true) since self-buffs don't affect the main character
  // NOTE: This hook must be called BEFORE the early return to avoid violating React's Rules of Hooks
  const conditionalFields = useMemo(() => {
    if (!characterKey) return undefined
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const result: Record<string, Field[]> = {}
    const charBuffs = buffs[characterKey] as
      | Record<string, { team?: boolean }>
      | undefined
    Object.values(sheet).forEach((section) => {
      section.documents.forEach((doc) => {
        if (
          doc.type === 'conditional' &&
          doc.conditional?.fields &&
          doc.conditional.fields.length > 0
        ) {
          const condName = doc.conditional.metadata.name
          const teamFields = doc.conditional.fields.filter((f) => {
            // If the field has an explicit team flag, use it
            if ('team' in f) return f.team !== false
            // Look up buff metadata for fields defined inline (without fieldForBuff)
            if ('fieldRef' in f && f.fieldRef?.name) {
              const buff = charBuffs?.[f.fieldRef.name]
              if (buff?.team !== undefined) return buff.team !== false
            }
            // No team info available — assume self-only (safe default)
            return false
          })
          if (teamFields.length === 0) return // skip if no team-wide fields
          if (!result[condName]) result[condName] = []
          // Deduplicate by stat key (q) — same stat from different sources
          // (e.g. exSpecial_atk + core_atk both → q: 'atk') shows once
          const seenQs = new Set(
            result[condName]
              .map((f) => ('fieldRef' in f ? f.fieldRef?.q : undefined))
              .filter(Boolean)
          )
          for (const field of teamFields) {
            const q = 'fieldRef' in field ? field.fieldRef?.q : undefined
            if (!q || !seenQs.has(q)) {
              if (q) seenQs.add(q)
              result[condName].push(field)
            }
          }
        }
      })
    })
    return result
  }, [characterKey])

  // Build conditional → description map from formula-ui sheet.
  // Multiple sheet entries may share the same condName — concatenate their
  // descriptions rather than overwriting, so users see all relevant info.
  const conditionalDescriptions = useMemo(() => {
    if (!characterKey) return undefined
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const result: Record<string, ReactNode> = {}
    Object.values(sheet).forEach((section) => {
      section.documents.forEach((doc) => {
        if (doc.type === 'conditional' && doc.conditional?.description) {
          const condName = doc.conditional.metadata.name
          const desc = doc.conditional.description
          if (typeof desc === 'function') return
          if (result[condName]) {
            // Append with a line break separator (always strings)
            result[condName] = `${result[condName]}\n\n${desc}`
          } else {
            result[condName] = desc
          }
        }
      })
    })
    return Object.keys(result).length > 0 ? result : undefined
  }, [characterKey])

  // Build conditional → label map from formula-ui sheet.
  const conditionalLabels = useMemo(() => {
    if (!characterKey) return undefined
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const result: Record<string, ReactNode> = {}
    Object.values(sheet).forEach((section) => {
      section.documents.forEach((doc) => {
        if (doc.type === 'conditional' && doc.conditional?.label) {
          const condName = doc.conditional.metadata.name
          const label = doc.conditional.label
          if (typeof label === 'function') return
          result[condName] = label
        }
      })
    })
    return Object.keys(result).length > 0 ? result : undefined
  }, [characterKey])

  // Extract passive (always-active) team-wide buff fields from 'fields' documents
  const passiveFields = useMemo(() => {
    if (!characterKey) return undefined
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const charBuffs = buffs[characterKey] as
      | Record<string, { team?: boolean }>
      | undefined
    if (!charBuffs) return undefined
    const result: {
      fields: Field[]
      /** 0 = always available, 1-6 = requires that mindscape level */
      mindscape: number
      sectionKey: string
      /** Paragraph index within the section's description (0-based, counting only 'fields' docs) */
      paragraph?: number
      groupTitle?: ReactNode
    }[] = []
    Object.entries(sheet).forEach(([sectionKey, section]) => {
      const mindscape = sectionKey.startsWith('m')
        ? Number(sectionKey.slice(1)) || 0
        : 0
      let fieldsDocIndex = 0
      let abilityFieldsDocIndex = 0
      section.documents.forEach((doc) => {
        if (doc.type === 'fields' && doc.fields?.length) {
          const groupedFields: Field[] = []
          for (const field of doc.fields) {
            if ('fieldRef' in field && field.fieldRef?.name) {
              const buffMeta = charBuffs[field.fieldRef.name]
              // Only include fields that match a known team-wide buff
              if (buffMeta && buffMeta.team === true) {
                groupedFields.push(field)
              }
            }
          }
          if (groupedFields.length > 0) {
            const isAbility =
              groupedFields[0] &&
              'fieldRef' in groupedFields[0] &&
              groupedFields[0].fieldRef?.name?.startsWith('ability_')
            // Ability desc paragraphs start at 1 (desc.0 is the condition text),
            // so use a separate counter offset by +1.
            // Mindscape sections use a single `mindscapes.X.desc` key (no paragraph sub-keys),
            // so don't set a paragraph index for them.
            const paragraph = sectionKey.startsWith('m')
              ? undefined
              : isAbility
                ? abilityFieldsDocIndex + 1
                : fieldsDocIndex
            result.push({
              fields: groupedFields,
              mindscape,
              sectionKey,
              paragraph,
              groupTitle:
                doc.type === 'fields' && 'header' in doc && doc.header
                  ? doc.header.text
                  : undefined,
            })
            if (isAbility) abilityFieldsDocIndex++
            else fieldsDocIndex++
          }
        }
      })
    })
    return result.length > 0 ? result : undefined
  }, [characterKey])

  return (
    <>
      <CharacterSingleSelectionModal
        show={showCharModal}
        onHide={onHideCharModal}
        onSelect={onCharSelect}
        showNone={!!characterKey}
      />
      {!characterKey ? (
        <Flex className={classes.card} p={16} align="center" justify="center">
          <Stack gap="sm" align="center">
            <Text size="sm" c="dimmed">
              Teammate {slotIndex + 1}
            </Text>
            <Button
              fullWidth
              variant="outline"
              onClick={onShowCharModal}
              size="xs"
            >
              Select Teammate
            </Button>
          </Stack>
        </Flex>
      ) : (
        <Stack className={classes.card} gap={0}>
          {/* ═══════════════════ Main two-column layout ═══════════════════ */}
          <Flex style={{ flex: 1, minHeight: 0 }} gap={0}>
            {/* ═══ Left column — Character ═══ */}
            <Flex
              direction="column"
              py={10}
              pl={10}
              pr={3}
              style={{
                flex: 1,
                minWidth: 0,
                borderRight: '1px solid var(--mantine-color-default-border)',
              }}
            >
              {/* Character header: avatar + name + sync */}
              <Group gap={6} wrap="nowrap" mb={6}>
                <Avatar
                  src={characterAsset(characterKey, 'circle')}
                  size={48}
                  radius={48}
                  className={classes.avatar}
                  onClick={onShowCharModal}
                />
                <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onShowCharModal}
                    fullWidth
                  >
                    <CharacterName characterKey={characterKey} />
                  </Button>
                </Flex>
              </Group>

              {/* Mindscape segmented control */}
              <SegmentedControl
                size="xs"
                value={String(effectiveMindscape)}
                data={MINDSCAPE_OPTIONS}
                onChange={(val) => setMindscape(Number(val))}
                fullWidth
                withItemsBorders={false}
                className={classes.segmented}
                mb={4}
              />

              {/* Saved Builds selector — compact inline */}
              <Box mb={4}>
                <CharacterBuildSelector characterKey={characterKey} compact />
              </Box>

              {/* Character conditionals */}
              <Box style={{ flex: 1, overflow: 'auto' }}>
                <CharacterConditionalsDisplay
                  characterKey={characterKey}
                  mindscapeOverride={effectiveMindscape}
                  conditionalFields={conditionalFields}
                  conditionalDescriptions={conditionalDescriptions}
                  conditionalLabels={conditionalLabels}
                  passiveFields={passiveFields}
                  showZeroFields={true}
                  showPassives={showCharPassives}
                />
              </Box>
            </Flex>

            {/* ═══ Right column — Disc conditionals (top) + W-Engine (bottom) ═══ */}
            <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
              {/* ═══ Upper right — Disc conditionals ═══ */}
              <Box
                style={{
                  flex: 1,
                  overflow: 'auto',
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  padding: '10px',
                  minHeight: 0,
                }}
              >
                {/* Equipped disc sets display */}
                <Flex direction="column" w="100%" gap={4} mb={6}>
                  {hasDiscInfo ? (
                    Object.entries(activeSets).map(([setKey, count]) => (
                      <Flex key={setKey} align="center" gap={4}>
                        <ImgIcon src={discDefIcon(setKey)} size={1.5} />
                        <Text
                          size="xs"
                          lineClamp={1}
                          style={{ flex: 1, lineHeight: '18px' }}
                        >
                          <DiscSetName setKey={setKey as any} />
                        </Text>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {count}p
                        </Text>
                      </Flex>
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      No disc sets
                    </Text>
                  )}
                </Flex>
                {hasDiscConditionals ? (
                  <DiscConditionalsDisplay
                    activeSets={activeSets}
                    teammateKey={characterKey}
                  />
                ) : (
                  <Text size="xs" c="dimmed" ta="center" mt="md">
                    No disc conditionals
                  </Text>
                )}
              </Box>

              {/* ═══ Bottom right — W-Engine conditionals ═══ */}
              <WengineSelectionModal
                show={showWengineModal}
                onHide={onHideWengineModal}
                onSelect={(wKey) => setWengineKey(wKey)}
                characterKey={characterKey}
              />
              <Box
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: '10px',
                  minHeight: 0,
                }}
              >
                {/* Header: wengine name + phase selector on one line */}
                <Flex gap={6} align="center" wrap="nowrap" mb={6}>
                  <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onShowWengineModal}
                      fullWidth
                    >
                      {teammateWengineKey ? (
                        <WengineName wKey={teammateWengineKey} />
                      ) : (
                        'Select a Wengine'
                      )}
                    </Button>
                  </Flex>
                  <SegmentedControl
                    size="xs"
                    value={String(effectiveWenginePhase)}
                    data={PHASE_OPTIONS}
                    onChange={(val) => setPhase(Number(val) as PhaseKey)}
                    withItemsBorders={false}
                  />
                </Flex>
                {/* Body: conditionals on left, icon on right (under phase selector) */}
                <Flex gap={8} style={{ flex: 1, minHeight: 0 }}>
                  <Box style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                    {teammateWengineKey ? (
                      <WEngineConditionalsDisplay
                        wengineKey={teammateWengineKey}
                        teammateKey={characterKey}
                        wenginePhase={effectiveWenginePhase}
                        showPassives={showWenginePassives}
                      />
                    ) : (
                      <Text size="xs" c="dimmed" ta="center" mt="md">
                        No wengine equipped
                      </Text>
                    )}
                  </Box>
                  <Flex
                    direction="column"
                    align="center"
                    justify="flex-start"
                    pt={4}
                    style={{ flexShrink: 0 }}
                  >
                    {teammateWengineKey ? (
                      <Avatar
                        src={wengineAsset(teammateWengineKey)}
                        size={48}
                        radius="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={onShowWengineModal}
                      />
                    ) : (
                      <Box
                        onClick={onShowWengineModal}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 'var(--mantine-radius-sm)',
                          background: 'var(--mantine-color-dark-6)',
                          cursor: 'pointer',
                        }}
                      />
                    )}
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Stack>
      )}
    </>
  )
}
