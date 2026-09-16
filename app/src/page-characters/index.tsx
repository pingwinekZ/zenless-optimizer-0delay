import { Box, Flex, SegmentedControl } from '@mantine/core'
import {
  useDataEntryBase,
  useDataManagerKeys,
} from '@zenless-optimizer/common/database-ui'
import { filterFunction, sortFunction } from '@zenless-optimizer/common/util'
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CharacterKey } from '../consts'
import { useDatabaseContext } from '../db-ui'
import {
  CharacterMenu,
  CharacterSingleSelectionModal,
  characterFilterConfigs,
  characterSortConfigs,
  characterSortMap,
  precomputedCssVars,
  StatHighlightContext,
  useCharacterTabStore,
} from '../ui'
import { CharacterEditModal } from './CharacterEditModal'
import { CharacterDragList } from './CharacterDragList'
import { CharacterPreview } from './CharacterPreview'
import { cardTotalW, defaultGap } from './constantsUi'
import { FilterBar } from './FilterBar'

export default function PageCharacter({
  onNavigateToOptimize,
}: {
  onNavigateToOptimize?: (characterKey: CharacterKey) => void
} = {}) {
  const { database } = useDatabaseContext()
  const displayCharacter = useDataEntryBase(database.displayCharacter)
  const focusCharacter = useCharacterTabStore((s) => s.focusCharacter)
  const setFocusCharacter = useCharacterTabStore((s) => s.setFocusCharacter)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const [statHighlight, setStatHighlight] = useState('')
  const statHLContextObj = useMemo(
    () => ({ statHighlight, setStatHighlight }),
    [statHighlight, setStatHighlight]
  )

  const [editCharacterKey, setEditCharacterKey] = useState<CharacterKey | null>(
    null
  )

  const [newCharacter, setnewCharacter] = useState(false)

  // Stable callbacks (HSR parity: stable references keep the memoized rows
  // from re-rendering when the parent does). State is read via functional
  // updates / getState so no per-render deps are needed.
  const editCharacter = useCallback(
    (characterKey: CharacterKey | null) => {
      if (characterKey === null) return
      if (!database.chars.get(characterKey)) {
        database.chars.getOrCreate(characterKey)
      }
      setEditCharacterKey(characterKey)
    },
    [database.chars]
  )

  const deleteCharacter = useCallback(
    (charKey: CharacterKey) => {
      if (!window.confirm(`Remove ${charKey}?`)) return
      database.chars.remove(charKey)
      setEditCharacterKey((prev) => (prev === charKey ? null : prev))
      if (useCharacterTabStore.getState().focusCharacter === charKey) {
        useCharacterTabStore.getState().setFocusCharacter(null)
      }
    },
    [database.chars]
  )

  const charKeys = useDataManagerKeys(database.chars)

  const filteredCharKeys = useMemo(() => {
    const { attribute, specialtyType, rarity, sortType, ascending } =
      displayCharacter
    return charKeys
      .filter(
        filterFunction(
          { attribute, specialtyType, rarity, name: deferredSearchTerm },
          characterFilterConfigs(database)
        )
      )
      .sort(
        sortFunction(
          characterSortMap[sortType] ?? [],
          ascending,
          characterSortConfigs(database),
          ['new', 'custom']
        )
      )
  }, [displayCharacter, charKeys, deferredSearchTerm, database])

  // Sync visual order to customSortOrder so the optimizer priority matches
  // what the user sees on the characters page.
  // The set() call is deferred via setTimeout to prevent React from detecting
  // a synchronous nested update when useSyncExternalStore's forceStoreRerender
  // flushes immediately outside React's execution context.
  const syncedOrderRef = useRef('')
  useEffect(() => {
    const current = database.displayCharacter.get().customSortOrder
    const serialized = filteredCharKeys.join(',')
    if (syncedOrderRef.current === serialized) return
    if (
      current.length !== filteredCharKeys.length ||
      current.some((ck, i) => ck !== filteredCharKeys[i])
    ) {
      syncedOrderRef.current = serialized
      const next = [...filteredCharKeys]
      setTimeout(() => {
        database.displayCharacter.set({ customSortOrder: next })
      }, 0)
    }
  }, [filteredCharKeys, database.displayCharacter])

  const { specialtyType, attribute, rarity } = displayCharacter

  const density = useCharacterTabStore((s) => s.density)
  const setDensity = useCharacterTabStore((s) => s.setDensity)

  const rowCssVars = useMemo(() => precomputedCssVars[density], [density])

  // Sync focus from optimizer's optCharKey on mount (HSR tab activation pattern)
  useEffect(() => {
    const optCharKey = database.dbMeta.get().optCharKey
    if (optCharKey) {
      setFocusCharacter(optCharKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Local focus for instant click feedback
  const [localFocus, setLocalFocus] = useState<CharacterKey | null>(null)
  useEffect(() => {
    setLocalFocus(null)
  }, [focusCharacter])
  const displayFocus = localFocus ?? focusCharacter

  // Stable row callbacks (HSR parity) — constant references keep the memoized
  // rows inside CharacterDragList from re-rendering when the page does.
  const handleRowClick = useCallback(
    (charKey: CharacterKey) => {
      setLocalFocus(charKey)
      setFocusCharacter(charKey)
    },
    [setFocusCharacter]
  )

  const handleRowDoubleClick = useCallback(
    (charKey: CharacterKey) => {
      setFocusCharacter(charKey)
      onNavigateToOptimize?.(charKey)
    },
    [setFocusCharacter, onNavigateToOptimize]
  )

  // Stable preview/filter callbacks — constant references let the memoized
  // CharacterPreview and FilterBar skip re-render on unrelated page commits
  // such as drag-reorder writes to displayCharacter.
  const handlePreviewEdit = useCallback(() => {
    if (focusCharacter) editCharacter(focusCharacter)
  }, [focusCharacter, editCharacter])
  const handlePreviewDelete = useCallback(() => {
    if (focusCharacter) deleteCharacter(focusCharacter)
  }, [focusCharacter, deleteCharacter])
  const handleSpecialtyChange = useCallback(
    (v: typeof specialtyType) =>
      database.displayCharacter.set({ specialtyType: v }),
    [database.displayCharacter]
  )
  const handleAttributeChange = useCallback(
    (v: typeof attribute) => database.displayCharacter.set({ attribute: v }),
    [database.displayCharacter]
  )
  const handleRarityChange = useCallback(
    (v: typeof rarity) => database.displayCharacter.set({ rarity: v }),
    [database.displayCharacter]
  )

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StatHighlightContext.Provider value={statHLContextObj}>
        <CharacterEditModal
          characterKey={editCharacterKey}
          onClose={() => setEditCharacterKey(null)}
        />
      </StatHighlightContext.Provider>
      <Suspense fallback={false}>
        <CharacterSingleSelectionModal
          show={newCharacter}
          onHide={() => setnewCharacter(false)}
          onSelect={(ck) => {
            editCharacter(ck)
            setnewCharacter(false)
          }}
        />
      </Suspense>

      {/* Root flex: list + preview columns */}
      <Flex style={{ width: '100%', height: '100%' }} gap={defaultGap}>
        {/* Left: CharacterMenu + Grid + Density */}
        <Box
          miw={300}
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: 300,
          }}
        >
          {/* Character Menu */}
          <CharacterMenu
            hasFocus={!!focusCharacter}
            onAdd={() => setnewCharacter(true)}
            onEdit={() => {
              if (focusCharacter) editCharacter(focusCharacter)
            }}
            onDelete={() => {
              if (focusCharacter) deleteCharacter(focusCharacter)
            }}
            onOptimize={() => {
              if (focusCharacter) {
                onNavigateToOptimize?.(focusCharacter)
              }
            }}
          />

          {/* Character Grid with DnD + ScrollArea (isolated component owns
              drag state so pickup/drop never re-renders the preview) */}
          <CharacterDragList
            charKeys={filteredCharKeys}
            displayFocus={displayFocus}
            rowCssVars={rowCssVars}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
            onEditCharacter={editCharacter}
            onDeleteCharacter={deleteCharacter}
          />

          {/* Density toggle */}
          <SegmentedControl
            data={[
              { value: 'default', label: 'Default' },
              { value: 'compact', label: 'Compact' },
            ]}
            value={density}
            onChange={(v) => setDensity(v as 'default' | 'compact')}
            fullWidth
          />
        </Box>

        {/* Right: Filter toggles + Preview */}
        <Box
          style={{
            flex: 1,
            minWidth: cardTotalW,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            position: 'relative',
            // Reserve room for the absolutely-positioned customize sidebar
            // (130px wide + 8px offset + 8px breathing room) so the fluid
            // card never slides underneath it and causes page scroll.
            marginRight: 146,
          }}
        >
          <FilterBar
            specialtyType={specialtyType}
            onSpecialtyChange={handleSpecialtyChange}
            attribute={attribute}
            onAttributeChange={handleAttributeChange}
            rarity={rarity}
            onRarityChange={handleRarityChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* CharacterPreview — always visible */}
          <CharacterPreview
            characterKey={focusCharacter}
            onEdit={focusCharacter ? handlePreviewEdit : undefined}
            onDelete={focusCharacter ? handlePreviewDelete : undefined}
          />
        </Box>
      </Flex>
    </Box>
  )
}

export { ShowcaseDiscCard, ShowcaseDiscPanel } from './card/ShowcaseDiscPanel'
