import { ActionIcon, Divider, Drawer, Flex } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Selecto from 'react-selecto'
import { discDefIcon } from '../../assets'
import {
  allDiscSetKeys,
  type CharacterKey,
  type DiscSetKey,
  discSetNames,
} from '../../consts'
import type { Team, TeamConditional } from '../../db'
import {
  COMBO_STATE_VERSION,
  getTeamFrame0,
  MAX_COMBO_HITS,
  parseComboState,
} from '../../db'
import { useDatabaseContext } from '../../db-ui'
import {
  conditionals as allConditionalsMeta,
  getConditional,
} from '../../formula'
import { CascaderSelect } from './CascaderSelect'
import { comboBoxWidth } from './comboDrawerConstants'
import { type CellKey, CondGroupRow } from './comboRows'
import './selecto.css'
import { MultiSelectPills } from '../layout/MultiSelectPills'
import { ComboSheetName, sortComboConds } from './comboLabels'
import {
  hashOf,
  hitOptionValue,
  parseHitValue,
  useComboDrawerStore,
  useComboFormulaGroups,
} from './useComboDrawerStore'
import {
  type ComboMember,
  filterRelevantConditionals,
  sortRelevantConditionals,
  synthesizeExtraSet,
  synthesizeTeammateConditionals,
} from './useComboMembers'

const drawerContentStyle = { width: 1560, height: '100%' } as const

const ENTER_DURATION = 500
const EXIT_DURATION = 250

/**
 * Advanced rotation menu (HSR port): full control over buff values for each
 * rotation hit. Drag across the boxes to toggle whole ranges; the hatched
 * first column is the locked main-form default.
 */
export function ComboDrawer({
  opened,
  close,
  characterKey,
  team,
  members,
}: {
  opened: boolean
  close: () => void
  characterKey: CharacterKey
  team: Team
  members: ComboMember[]
}) {
  const { database } = useDatabaseContext()
  const [contentMounted, setContentMounted] = useState(false)

  // Latest props for the open/close effect below. The effect intentionally
  // depends only on `opened` (like HSR's original): depending on `team`
  // re-runs the close branch after every save, and the save itself updates
  // the team — an infinite loop.
  const latest = useRef({ team, members, database, characterKey })
  latest.current = { team, members, database, characterKey }

  useLayoutEffect(() => {
    const {
      team: currentTeam,
      members: currentMembers,
      database: currentDatabase,
      characterKey: currentCharacterKey,
    } = latest.current
    if (opened) {
      const frame0 = getTeamFrame0(currentTeam)
      const hits = frame0.tag?.rotation ?? []
      const relevant = filterRelevantConditionals(
        frame0.conditionals,
        currentMembers
      )
      const relevantSheets = new Set<string>(
        relevant.map((c) => c.sheet as string)
      )
      const mainKey = currentMembers[0]?.key as string | undefined
      // Restore extra (unequipped) disc sets picked in previous sessions,
      // skipping sets that are equipped by now (covered above).
      const extraSets =
        parseComboState(
          frame0.tag?.comboStateJson,
          hits.length
        )?.extraSets?.filter((setKey) => !relevantSheets.has(setKey)) ?? []
      const extras = extraSets.flatMap((setKey) =>
        mainKey ? synthesizeExtraSet(setKey, mainKey) : []
      )
      useComboDrawerStore
        .getState()
        .initialize(
          hits,
          sortRelevantConditionals(
            synthesizeTeammateConditionals(relevant, currentMembers).concat(
              extras
            ),
            currentMembers
          ),
          frame0.tag?.comboStateJson,
          currentMembers
        )
      setContentMounted(true)
      return undefined
    } else {
      // Flush (save state) immediately, but delay store reset and content
      // unmount so the exit transition can play with real content.
      const s = useComboDrawerStore.getState()
      // Skip when the drawer was never opened: without this guard the
      // close branch would write on every mount.
      if (s.initialized) {
        const defaults = s.defaults
        const defaultByHash = new Map(
          s.conditionals.map((c) => [
            hashOf(c),
            defaults[hashOf(c)] ?? c.condValue,
          ])
        )
        // Hashes of rows that exist in the frame (for blob pruning below).
        const frameHashes = new Set(
          getTeamFrame0(currentTeam).conditionals.map(hashOf)
        )
        currentDatabase.teams.setFrame0(currentCharacterKey, (frame) => {
          const tag = frame.tag
          if (!tag?.rotation) return false
          // Merge drawer edits back into the full frame conditionals so
          // entries the drawer doesn't show are preserved untouched.
          const conditionals = frame.conditionals.map((c) => {
            const v = defaultByHash.get(hashOf(c))
            return v !== undefined && v !== c.condValue
              ? { ...c, condValue: v }
              : c
          })
          // Materialize synthesized teammate rows, but only when edited —
          // untouched rows stay absent (matching page behavior).
          for (const c of s.conditionals) {
            const hash = hashOf(c)
            if (frameHashes.has(hash) || !s.dirty[hash]) continue
            frameHashes.add(hash)
            conditionals.push({
              ...c,
              condValue: defaults[hash] ?? c.condValue,
            })
          }
          const values: Record<string, number[]> = {}
          for (const [hash, arr] of Object.entries(s.values))
            if (arr.length === s.hits.length && frameHashes.has(hash))
              values[hash] = arr
          return {
            conditionals,
            tag: {
              ...tag,
              rotation: s.hits,
              comboType: 'advanced',
              comboStateJson: JSON.stringify({
                version: COMBO_STATE_VERSION,
                values,
                ...(s.extraSets.length > 0 ? { extraSets: s.extraSets } : {}),
              }),
            },
          }
        })
      }
      const timer = setTimeout(() => {
        useComboDrawerStore.getState().reset()
        setContentMounted(false)
      }, EXIT_DURATION)
      return () => clearTimeout(timer)
    }
    // Deps: `opened` only — see the `latest` ref above.
  }, [opened])

  return (
    <Drawer
      title={<ComboHeader />}
      position="right"
      onClose={close}
      opened={opened}
      size={1625}
      transitionProps={{
        duration: ENTER_DURATION,
        exitDuration: EXIT_DURATION,
        transition: 'slide-left',
      }}
      overlayProps={{
        transitionProps: {
          duration: ENTER_DURATION,
          exitDuration: EXIT_DURATION,
        },
      }}
      styles={{
        header: {
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--layer-2)',
        },
        body: { paddingTop: 0 },
      }}
    >
      {contentMounted && <ComboDrawerContent />}
    </Drawer>
  )
}

// Header columns tile with the same pitch as the grid cells below
// (40px outer, overlapping borders).
const headerSelectorStyle = { width: comboBoxWidth, marginLeft: -1 }

function HeaderAbilitySelector({ index }: { index: number }) {
  const hits = useComboDrawerStore((s) => s.hits)
  const setHitAbility = useComboDrawerStore((s) => s.setHitAbility)
  const removeHit = useComboDrawerStore((s) => s.removeHit)
  const groups = useComboFormulaGroups()
  if (index === 0) return null
  const hit = hits[index - 1]
  if (!hit) return null
  // The clear button sits below the selector: at cell width there is no
  // room for it inside the input.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: comboBoxWidth,
        marginLeft: -1,
      }}
    >
      <CascaderSelect
        data={groups}
        value={hitOptionValue(groups, hit.sheet, hit.name)}
        placeholder="Ability"
        menuWidth={240}
        styles={{
          input: {
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
        style={headerSelectorStyle}
        onChange={(v) => {
          const parsed = parseHitValue(v)
          if (parsed) setHitAbility(index - 1, parsed.sheet, parsed.name)
        }}
      />
      <ActionIcon
        size="xs"
        variant="subtle"
        color="gray"
        aria-label={`Remove hit ${index}`}
        onClick={() => removeHit(index - 1)}
      >
        <IconX size={12} />
      </ActionIcon>
    </div>
  )
}

/** Trailing empty slot that appends a hit, mirroring the card's add-hit. */
function AppendHitSelector() {
  const hitCount = useComboDrawerStore((s) => s.hits.length)
  const appendHit = useComboDrawerStore((s) => s.appendHit)
  const groups = useComboFormulaGroups()
  if (hitCount >= MAX_COMBO_HITS) return null
  // Trailing slot: sized to fit its label instead of the cell pitch.
  return (
    <CascaderSelect
      data={groups}
      value={null}
      placeholder="Add hit"
      menuWidth={240}
      styles={{
        input: {
          fontSize: 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }}
      style={{ width: 'auto', minWidth: 84, marginLeft: -1 }}
      onChange={(v) => {
        const parsed = parseHitValue(v)
        if (parsed) appendHit(parsed.sheet, parsed.name)
      }}
    />
  )
}

function ComboHeader() {
  const hitCount = useComboDrawerStore((s) => s.hits.length)
  const columns = useMemo(
    () =>
      Array(hitCount + 1)
        .fill(false)
        .map((_, index) => <HeaderAbilitySelector key={index} index={index} />),
    [hitCount]
  )
  // Long rotations overflow the title bar: scroll them (and the trailing
  // Add-hit slot) instead of clipping. Columns tile seamlessly like the
  // grid cells below.
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <Flex gap={0} align="center" style={{ width: 'max-content' }}>
        {/* Mirror the body geometry (8 group padding + 110 sheet panel +
            10 gap + 285 row label) so hit selectors sit over grid cells. */}
        <div style={{ width: 413 }}>
          <div style={{ width: 'fit-content', fontWeight: 700 }}>
            Advanced Rotation
          </div>
        </div>
        <div style={{ width: comboBoxWidth }} />
        {columns}
        <AppendHitSelector />
      </Flex>
    </div>
  )
}

function GroupDivider({ sheetKey }: { sheetKey: string }) {
  return (
    <Divider
      label={<ComboSheetName sheetKey={sheetKey} />}
      labelPosition="center"
    />
  )
}

function StateDisplay() {
  const conditionals = useComboDrawerStore((s) => s.conditionals)
  const grouped = useMemo(() => {
    const map = new Map<string, TeamConditional[]>()
    for (const c of conditionals) {
      const list = map.get(c.sheet) ?? []
      list.push(c)
      map.set(c.sheet, list)
    }
    return [...map.entries()].map(
      ([sheet, conds]) => [sheet, sortComboConds(sheet, conds)] as const
    )
  }, [conditionals])

  if (grouped.length === 0) return <div>No conditional buffs</div>

  return (
    <Flex direction="column" gap={8}>
      {grouped.map(([sheet, conds]) => (
        <div key={sheet}>
          <GroupDivider sheetKey={sheet} />
          <div style={{ marginTop: 8 }}>
            <CondGroupRow sheet={sheet} conds={conds} />
          </div>
        </div>
      ))}
    </Flex>
  )
}

function locateKind(hash: string): 'bool' | 'partition' {
  const s = useComboDrawerStore.getState()
  const cond = s.conditionals.find((c) => hashOf(c) === hash)
  if (!cond) return 'bool'
  const data = getConditional(cond.sheet as never, cond.condKey)
  return !data || data.type === 'bool' ? 'bool' : 'partition'
}

function cellValue(hash: string, index: number): number {
  const s = useComboDrawerStore.getState()
  if (index === 0) return s.defaults[hash] ?? 0
  return s.values[hash]?.[index - 1] ?? 0
}

/**
 * Disc set selector, mirroring HSR's set selectors: a multi-select pill
 * input with set icons that toggles conditionals rows for unequipped sets.
 * The optimizer swaps the main character's discs, so activations configured
 * here apply whenever an evaluated build equips the set.
 */
function SetSelectors() {
  const extraSets = useComboDrawerStore((s) => s.extraSets)
  const members = useComboDrawerStore((s) => s.members)
  const conditionals = useComboDrawerStore((s) => s.conditionals)
  const addExtraSet = useComboDrawerStore((s) => s.addExtraSet)
  const removeExtraSet = useComboDrawerStore((s) => s.removeExtraSet)

  const visibleSheets = useMemo(
    () => new Set(conditionals.map((c) => c.sheet)),
    [conditionals]
  )
  const options = useMemo(
    () =>
      allDiscSetKeys
        // Keep selected sets listed so they can be unchecked; only hide
        // equipped sets (their rows are always shown, not picker-managed).
        // Sets without conditionals (passive-only, e.g. Feathered Fate)
        // have no rows to show, so they are hidden as well.
        .filter(
          (setKey) =>
            (!visibleSheets.has(setKey) || extraSets.includes(setKey)) &&
            Object.keys(
              (allConditionalsMeta as Record<string, Record<string, unknown>>)[
                setKey
              ] ?? {}
            ).length > 0
        )
        .map((setKey) => ({
          value: setKey,
          label: discSetNames[setKey] ?? setKey,
        })),
    [visibleSheets, extraSets]
  )
  const labelMap = useMemo(
    () =>
      new Map<string, string>(
        options.map((opt) => [opt.value, opt.label] as const)
      ),
    [options]
  )
  const mainKey = members[0]?.key as string | undefined

  const renderOption = useCallback(
    (opt: { value: string; label: string }) => (
      <Flex gap={8} align="center" wrap="nowrap">
        <ImgIcon src={discDefIcon(opt.value as DiscSetKey)} size={1.5} />
        <span>{labelMap.get(opt.value) ?? opt.label}</span>
      </Flex>
    ),
    [labelMap]
  )

  return (
    <Flex w="100%" gap={10}>
      <MultiSelectPills
        dropdownWidth={600}
        maxDisplayedValues={1}
        maxDropdownHeight={600}
        columns={2}
        clearable
        style={{ flex: 1 }}
        data={options}
        placeholder="Disc set conditionals"
        value={extraSets}
        onChange={(selected) => {
          if (!mainKey) return
          const prev = new Set(extraSets)
          const next = new Set(selected)
          for (const setKey of next)
            if (!prev.has(setKey))
              addExtraSet(setKey, synthesizeExtraSet(setKey, mainKey))
          for (const setKey of prev)
            if (!next.has(setKey)) removeExtraSet(setKey)
        }}
        renderOption={renderOption}
      />
    </Flex>
  )
}

function ComboDrawerContent() {
  const initialized = useComboDrawerStore((s) => s.initialized)

  const selectoRef: RefObject<Selecto | null> = useRef<Selecto>(null)
  const selectActivationState = useRef(true)
  const lastSelectedKeyState = useRef<string | undefined>(undefined)
  const startCellKind = useRef<'bool' | 'partition' | null>(null)

  const handleDragStart = useCallback(
    (
      e: Parameters<React.ComponentProps<typeof Selecto>['onDragStart'] & {}>[0]
    ) => {
      // Clear Selecto's internal selection so every click/drag starts fresh.
      selectoRef.current?.setSelectedTargets([])
      lastSelectedKeyState.current = undefined

      const startKey: string =
        (
          (e.inputEvent as MouseEvent).target as HTMLElement | null
        )?.getAttribute('data-key') ?? '{}'
      const dataKey: CellKey = JSON.parse(startKey)
      if (!dataKey.hash || dataKey.index === 0 || dataKey.locked) return

      startCellKind.current = locateKind(dataKey.hash)
      if (startCellKind.current === 'bool') {
        selectActivationState.current =
          cellValue(dataKey.hash, dataKey.index) === 0
      } else {
        selectActivationState.current = true
      }
    },
    []
  )

  const handleDrag = useCallback(
    (e: Parameters<React.ComponentProps<typeof Selecto>['onDrag'] & {}>[0]) => {
      const selectedKey: string =
        (
          (e.inputEvent as MouseEvent).target as HTMLElement | null
        )?.getAttribute('data-key') ?? '{}'
      if (selectedKey === lastSelectedKeyState.current) return

      const dataKey: CellKey = JSON.parse(selectedKey)
      if (!dataKey.hash || dataKey.index === 0 || dataKey.locked) {
        lastSelectedKeyState.current = selectedKey
        return
      }

      // Skip cross-kind cells
      if (locateKind(dataKey.hash) !== startCellKind.current) {
        lastSelectedKeyState.current = selectedKey
        return
      }

      // Partition cells carry their absolute value — apply live while dragging
      if (dataKey.kind === 'partition') {
        useComboDrawerStore
          .getState()
          .setHitValue(dataKey.hash, dataKey.index - 1, dataKey.value)
      }

      lastSelectedKeyState.current = selectedKey
    },
    []
  )

  const handleSelect = useCallback(
    (
      e: Parameters<React.ComponentProps<typeof Selecto>['onSelect'] & {}>[0]
    ) => {
      const activate = selectActivationState.current
      const updates: Array<{ hash: string; index: number; value: number }> = []

      const collect = (el: Element, removed: boolean) => {
        const keyStr = el.getAttribute('data-key') ?? '{}'
        const key: CellKey = JSON.parse(keyStr)
        if (!key.hash || key.index === 0 || key.locked) return
        if (locateKind(key.hash) !== startCellKind.current) return
        if (key.kind === 'bool') {
          updates.push({
            hash: key.hash,
            index: key.index - 1,
            value: (removed ? !activate : activate) ? 1 : 0,
          })
        } else if (!removed) {
          updates.push({
            hash: key.hash,
            index: key.index - 1,
            value: key.value,
          })
        }
      }
      e.added.forEach((el) => collect(el, false))
      e.removed.forEach((el) => collect(el, true))

      if (updates.length > 0) {
        useComboDrawerStore.getState().batchSetHitValues(updates)
      }
    },
    []
  )

  if (!initialized) {
    return <div style={{ ...drawerContentStyle, minHeight: 400 }} />
  }

  return (
    <div style={drawerContentStyle}>
      <div style={{ marginBottom: 8 }}>
        <SetSelectors />
      </div>
      <StateDisplay />
      <Selecto
        ref={selectoRef}
        className="selecto-selection"
        selectableTargets={['.selectable']}
        selectByClick={true}
        selectFromInside={true}
        continueSelect={false}
        keyContainer={window}
        hitRate={0}
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onSelect={handleSelect}
      />
    </div>
  )
}
