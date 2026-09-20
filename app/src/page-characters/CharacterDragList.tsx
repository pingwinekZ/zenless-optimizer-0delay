import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { CharacterRow, DragOverlayRow } from '@zenless-optimizer/zzz/ui'
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react'
import {
  type CSSProperties,
  type MutableRefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import classes from './CharacterGrid.module.css'
import { useShowcaseRowColor } from './color/useShowcaseRowTheme'

const dropAnimationDuration = 200

const dropAnimationConfig: DropAnimation = {
  duration: dropAnimationDuration,
  easing: 'ease',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0' } },
  }),
}

// Isolated character list with drag-and-drop reordering.
//
// Owns the DnD state (`activeId`) so pickup/drop re-renders stay inside the
// list — the character preview, filter bar, and modals in the parent page
// never re-render from drag state changes (mirrors HSR's CharacterGrid,
// which holds its own activeId separate from the preview panel).
export const CharacterDragList = memo(function CharacterDragList({
  charKeys,
  displayFocus,
  rowCssVars,
  onRowClick,
  onRowDoubleClick,
  onEditCharacter,
  onDeleteCharacter,
}: {
  charKeys: CharacterKey[]
  displayFocus: CharacterKey | null
  rowCssVars: CSSProperties
  onRowClick: (characterKey: CharacterKey) => void
  onRowDoubleClick: (characterKey: CharacterKey) => void
  onEditCharacter: (characterKey: CharacterKey) => void
  onDeleteCharacter: (characterKey: CharacterKey) => void
}) {
  const { database } = useDatabaseContext()

  const gridRef = useRef<HTMLDivElement>(null)
  const osRef = useCallback(
    (instance: OverlayScrollbarsComponentRef<'div'> | null) => {
      ;(gridRef as MutableRefObject<HTMLDivElement | null>).current =
        instance?.getElement() ?? null
    },
    []
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    gridRef.current?.setAttribute('data-dragging-active', '')
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      gridRef.current?.removeAttribute('data-dragging-active')

      // Suppress row transitions for one paint to prevent "float from top" glitch
      const container = gridRef.current
      if (container) {
        container.setAttribute('data-suppress-transition', 'true')
        requestAnimationFrame(() =>
          container.removeAttribute('data-suppress-transition')
        )
      }

      // Clear activeId after the drop animation so the overlay content stays
      // rendered while it animates back (HSR parity).
      setTimeout(() => setActiveId(null), dropAnimationDuration)

      const { active, over } = event
      if (!over || active.id === over.id) return

      // Read the current displayed order from the ref — this always matches
      // what the user sees, unlike a closure-captured order which can be
      // stale when sortType is not 'custom'.
      const currentOrder = charKeysRef.current
      const oldIndex = currentOrder.indexOf(active.id as CharacterKey)
      const newIndex = currentOrder.indexOf(over.id as CharacterKey)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...currentOrder]
      reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, active.id as CharacterKey)

      // If filters are active, currentOrder may be a subset of the full
      // customSortOrder. Preserve any filtered-out characters at the end so
      // they don't get silently dropped from the priority order.
      const fullExisting = database.displayCharacter.get().customSortOrder
      if (fullExisting?.length) {
        const newSet = new Set(reordered)
        const preserved = fullExisting.filter(
          (ck) => !newSet.has(ck as CharacterKey)
        )
        reordered.push(...(preserved as CharacterKey[]))
      }

      database.displayCharacter.set({
        sortType: 'custom',
        customSortOrder: reordered,
      })
    },
    [database.displayCharacter]
  )

  const handleDragCancel = useCallback(() => {
    gridRef.current?.removeAttribute('data-dragging-active')
    setTimeout(() => setActiveId(null), dropAnimationDuration)
  }, [])

  // Keep a ref so handleDragEnd always reads the latest displayed order.
  const charKeysRef = useRef(charKeys)
  charKeysRef.current = charKeys

  const itemIds = useMemo(() => charKeys as string[], [charKeys])

  const rankMap = useMemo(
    () => new Map(charKeys.map((ck, i) => [ck, i])),
    [charKeys]
  )

  const activeShowcaseColor = useShowcaseRowColor(
    (activeId as CharacterKey) ?? ''
  )

  return (
    <OverlayScrollbarsComponent
      ref={osRef}
      className={classes.gridContainer}
      data-container-border="true"
      options={{
        scrollbars: { autoHide: 'move', autoHideDelay: 500 },
      }}
      style={{
        maxHeight: 'calc(100vh - 160px)',
        ...rowCssVars,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {charKeys.map((charKey) => (
            <SortableCharacterRow
              key={charKey}
              characterKey={charKey}
              isFocused={charKey === displayFocus}
              rank={rankMap.get(charKey) ?? 0}
              onClick={onRowClick}
              onDoubleClick={onRowDoubleClick}
              onEdit={onEditCharacter}
              onDelete={onDeleteCharacter}
            />
          ))}
        </SortableContext>
        <DragOverlay
          dropAnimation={dropAnimationConfig}
          modifiers={[restrictToVerticalAxis]}
        >
          {activeId && (
            <DragOverlayRow
              characterKey={activeId as CharacterKey}
              rank={rankMap.get(activeId as CharacterKey) ?? 0}
              showcaseColor={activeShowcaseColor}
            />
          )}
        </DragOverlay>
      </DndContext>
    </OverlayScrollbarsComponent>
  )
})

const SortableCharacterRow = memo(function SortableCharacterRow({
  characterKey,
  isFocused,
  rank,
  onClick,
  onDoubleClick,
  onEdit,
  onDelete,
}: {
  characterKey: CharacterKey
  isFocused: boolean
  rank: number
  onClick: (characterKey: CharacterKey) => void
  onDoubleClick?: (characterKey: CharacterKey) => void
  onEdit?: (characterKey: CharacterKey) => void
  onDelete?: (characterKey: CharacterKey) => void
}) {
  // `isDragging` comes from the hook (HSR parity) — no parent-driven prop,
  // so drag state changes don't churn row props.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: characterKey,
    animateLayoutChanges: () => false,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(setNodeRef, scrollRef)

  // Load-once via IntersectionObserver
  const [loadImages, setLoadImages] = useState(false)

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isFocused])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setLoadImages(true)
          obs.disconnect()
        }
      },
      { rootMargin: '500px 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [characterKey])

  const showcaseColor = useShowcaseRowColor(characterKey)

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transform ? transition : undefined,
    opacity: isDragging ? 0.4 : undefined,
  }

  return (
    <Box ref={mergedRef} style={style} {...attributes} {...listeners}>
      <CharacterRow
        characterKey={characterKey}
        isFocused={isFocused}
        rank={rank}
        loadImages={loadImages || isFocused}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onEdit={onEdit}
        onDelete={onDelete}
        showcaseColor={showcaseColor}
      />
    </Box>
  )
})
