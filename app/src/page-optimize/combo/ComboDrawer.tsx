import { Divider, Drawer, Flex } from '@mantine/core'
import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Selecto from 'react-selecto'
import type { CharacterKey } from '../../consts'
import type { Team, TeamConditional } from '../../db'
import { COMBO_STATE_VERSION, getTeamFrame0 } from '../../db'
import { useDatabaseContext } from '../../db-ui'
import { getConditional } from '../../formula'
import { CascaderSelect } from './CascaderSelect'
import { abilityGap, abilityWidth } from './comboDrawerConstants'
import { type CellKey, CondGroupRow } from './comboRows'
import './selecto.css'
import {
  hashOf,
  parseHitValue,
  useComboDrawerStore,
  useComboFormulaGroups,
} from './useComboDrawerStore'
import {
  type ComboMember,
  filterRelevantConditionals,
  sortRelevantConditionals,
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
      useComboDrawerStore
        .getState()
        .initialize(
          frame0.tag?.rotation ?? [],
          sortRelevantConditionals(
            filterRelevantConditionals(frame0.conditionals, currentMembers),
            currentMembers
          ),
          frame0.tag?.comboStateJson
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
          const values: Record<string, number[]> = {}
          for (const [hash, arr] of Object.entries(s.values))
            if (arr.length === s.hits.length) values[hash] = arr
          return {
            conditionals,
            tag: {
              ...tag,
              rotation: s.hits,
              comboType: 'advanced',
              comboStateJson: JSON.stringify({
                version: COMBO_STATE_VERSION,
                values,
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

const headerSelectorStyle = { width: abilityWidth }

function HeaderAbilitySelector({ index }: { index: number }) {
  const hits = useComboDrawerStore((s) => s.hits)
  const setHitAbility = useComboDrawerStore((s) => s.setHitAbility)
  const removeHit = useComboDrawerStore((s) => s.removeHit)
  const groups = useComboFormulaGroups()
  if (index === 0) return null
  const hit = hits[index - 1]
  if (!hit) return null
  return (
    <CascaderSelect
      data={groups}
      value={`${hit.sheet}|||${hit.name}`}
      placeholder="Ability"
      styles={{
        input: {
          fontSize: 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }}
      style={headerSelectorStyle}
      clearable
      onClear={() => removeHit(index - 1)}
      onChange={(v) => {
        const parsed = parseHitValue(v)
        if (parsed) setHitAbility(index - 1, parsed.sheet, parsed.name)
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
  return (
    <Flex gap={abilityGap} align="center">
      <div style={{ width: 380 }}>
        <div style={{ width: 'fit-content', fontWeight: 700 }}>
          Advanced Rotation
        </div>
      </div>
      <div style={{ width: abilityWidth }} />
      {columns}
    </Flex>
  )
}

function GroupDivider({ text }: { text: string }) {
  return <Divider label={text} labelPosition="center" />
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
    return [...map.entries()]
  }, [conditionals])

  if (grouped.length === 0) return <div>No conditional buffs</div>

  return (
    <Flex direction="column" gap={8}>
      {grouped.map(([sheet, conds]) => (
        <div key={sheet}>
          <GroupDivider text={sheet} />
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
      if (!dataKey.hash || dataKey.index === 0) return

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
      if (!dataKey.hash || dataKey.index === 0) {
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
        if (!key.hash || key.index === 0) return
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
