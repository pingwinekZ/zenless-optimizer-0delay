import {
  Badge,
  Box,
  Button,
  CloseButton,
  Divider,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { ModalWrapper } from '@zenless-optimizer/common/ui'
import { toggleInArr } from '@zenless-optimizer/common/util'
import { memo, useCallback, useContext, useMemo, useState } from 'react'
import { discDefIcon } from '../../assets'
import type { DiscSetKey, DiscSlotKey } from '../../consts'
import {
  allDiscSetKeys,
  disc2pEffect,
  discSetNames,
  statKeyTextMap,
} from '../../consts'
import type { ICachedDisc } from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import classes from './DiscSetFilterModal.module.css'

export function DiscSetFilterModal({
  show,
  onClose,
  discsBySlot: _discsBySlot,
  disabled,
}: {
  show: boolean
  onClose: () => void
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
}) {
  return (
    <ModalWrapper
      opened={show}
      onClose={onClose}
      size={1200}
      centered
      containerProps={{ style: { minHeight: undefined } }}
    >
      <DiscSetFilterModalContent close={onClose} disabled={disabled} />
    </ModalWrapper>
  )
}

function DiscSetFilterModalContent({
  close,
  disabled,
}: {
  close: () => void
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const { setFilter2 = [], setFilter4 = [] } = optConfig

  const [mode, setMode] = useState<'4p' | '2p'>('4p')
  const [search, setSearch] = useState('')

  const currentFilter = mode === '4p' ? setFilter4 : setFilter2

  const setCurrentFilter = useCallback(
    (keys: DiscSetKey[]) => {
      if (mode === '4p') {
        database.optConfigs.set(optConfigId, { setFilter4: keys })
      } else {
        database.optConfigs.set(optConfigId, { setFilter2: keys })
      }
    },
    [database, optConfigId, mode]
  )

  const initialFilters = useMemo(
    () => ({ setFilter2, setFilter4 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleToggle = useCallback(
    (setKey: DiscSetKey) => {
      setCurrentFilter(
        currentFilter.length
          ? toggleInArr([...currentFilter], setKey)
          : [setKey]
      )
    },
    [currentFilter, setCurrentFilter]
  )

  const effectGroups = useMemo(() => buildEffectGroups(), [])

  const handleEffectToggle = useCallback(
    (group: EffectGroup) => {
      const groupSetKeys = group.setKeys
      const someSelected = groupSetKeys.some((k) => currentFilter.includes(k))
      if (someSelected) {
        // Remove all sets in this group
        setCurrentFilter(currentFilter.filter((k) => !groupSetKeys.includes(k)))
      } else {
        // Add all sets in this group
        const existing = new Set(currentFilter)
        const merged = [
          ...currentFilter,
          ...groupSetKeys.filter((k) => !existing.has(k)),
        ]
        setCurrentFilter(merged)
      }
    },
    [currentFilter, setCurrentFilter]
  )

  const handleRevert = useCallback(() => {
    database.optConfigs.set(optConfigId, initialFilters)
  }, [database, optConfigId, initialFilters])

  const clearAll = useCallback(() => {
    if (mode === '4p') {
      database.optConfigs.set(optConfigId, { setFilter4: [] })
    } else {
      database.optConfigs.set(optConfigId, { setFilter2: [] })
    }
  }, [database, optConfigId, mode])

  const handleModeSwitch = useCallback((val: string) => {
    setMode(val as '4p' | '2p')
    setSearch('')
  }, [])

  const hasSelection = currentFilter.length > 0

  return (
    <Stack gap={0}>
      <Divider label="Selected Sets" labelPosition="center" mx="sm" mt="xs" />

      <Group gap="xs" p="sm" wrap="nowrap" align="center">
        <Stack gap={4} style={{ flex: 1 }}>
          <Group
            gap={5}
            wrap="wrap"
            align="center"
            className={classes.collectorRow}
          >
            {currentFilter.length === 0 && (
              <Text size="xs" c="dimmed">
                Sets
              </Text>
            )}
            {currentFilter.map((key) => (
              <Badge
                key={key}
                variant="default"
                radius="sm"
                size="lg"
                h={28}
                pl={6}
                pr={3}
                rightSection={
                  <CloseButton
                    size="xs"
                    variant="transparent"
                    onClick={() =>
                      setCurrentFilter(currentFilter.filter((k) => k !== key))
                    }
                  />
                }
              >
                <img
                  className={classes.collectorImg}
                  src={discDefIcon(key)}
                  alt=""
                />
              </Badge>
            ))}
          </Group>
        </Stack>

        {hasSelection && (
          <Button variant="subtle" size="compact-xs" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </Group>

      <Box p="sm">
        <Stack gap={10}>
          <TextInput
            data-autofocus
            placeholder={
              mode === '2p' ? 'Search effects...' : 'Search disc sets...'
            }
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="xs"
            rightSection={
              search ? (
                <CloseButton size="xs" onClick={() => setSearch('')} />
              ) : undefined
            }
          />

          <Divider
            label={mode === '2p' ? '2-Piece Effects' : 'Disc Sets'}
            labelPosition="center"
          />

          <SegmentedControl
            value={mode}
            onChange={handleModeSwitch}
            size="xs"
            data={[
              { label: '4-Piece', value: '4p' },
              { label: '2-Piece', value: '2p' },
            ]}
            disabled={disabled}
          />

          <Box style={{ maxHeight: 400, overflowY: 'auto' }}>
            {mode === '2p' ? (
              <EffectGrid
                effectGroups={effectGroups}
                checkedSetKeys={new Set(currentFilter)}
                onToggle={handleEffectToggle}
                search={search}
              />
            ) : (
              <DiscSetGrid
                setKeys={allDiscSetKeys}
                checkedNames={new Set(currentFilter)}
                onToggle={handleToggle}
                search={search}
              />
            )}
          </Box>
        </Stack>
      </Box>

      <Group className={classes.footer} p="sm" justify="flex-end" gap={6}>
        <Button variant="default" size="xs" onClick={handleRevert}>
          Revert
        </Button>
        <Button variant="filled" size="xs" onClick={close}>
          Done
        </Button>
      </Group>
    </Stack>
  )
}

function DiscSetGrid({
  setKeys,
  checkedNames,
  onToggle,
  search,
}: {
  setKeys: readonly DiscSetKey[]
  checkedNames: Set<string>
  onToggle: (setKey: DiscSetKey) => void
  search: string
}) {
  const columns = useMemo(() => {
    const cols: DiscSetKey[][] = [[], [], [], [], [], []]
    setKeys.forEach((k, i) => cols[i % 6].push(k))
    return cols
  }, [setKeys])

  const q = search.toLowerCase()

  return (
    <div className={classes.setGrid}>
      {columns.map((col, ci) => (
        <div key={ci} className={classes.gridColumn}>
          {col.map((key) => (
            <DiscSetRow
              key={key}
              setKey={key}
              checked={checkedNames.has(key)}
              dimmed={
                !!search &&
                !discSetNames[key]?.toLowerCase().includes(q) &&
                !key.toLowerCase().includes(q)
              }
              onToggle={onToggle}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const DiscSetRow = memo(function DiscSetRow({
  setKey,
  checked,
  dimmed,
  onToggle,
}: {
  setKey: DiscSetKey
  checked: boolean
  dimmed: boolean
  onToggle: (setKey: DiscSetKey) => void
}) {
  const handleClick = useCallback(() => onToggle(setKey), [onToggle, setKey])

  return (
    <UnstyledButton
      className={`${classes.setRow} ${checked ? classes.setRowChecked : ''} ${dimmed ? classes.setRowDimmed : ''}`}
      onClick={handleClick}
    >
      <img className={classes.setImg} src={discDefIcon(setKey)} alt="" />
      <Text
        size="xs"
        truncate
        fw={checked ? 600 : undefined}
        c={checked ? undefined : 'dimmed'}
        style={{ flex: 1, minWidth: 0 }}
      >
        {discSetNames[setKey] ?? setKey}
      </Text>
    </UnstyledButton>
  )
})

// ── 2-Piece Effect Grouping ──

interface EffectGroup {
  effectKey: string
  label: string
  setKeys: DiscSetKey[]
}

// Override labels for disc sets where the 2p effect description differs
// from what the generic stat-key→label would produce (e.g. special damage types)
const effectLabelOverrides: Record<
  string,
  { label: string; effectKey: string }
> = {
  DawnsBloom: {
    label: 'Basic ATK DMG +15%',
    effectKey: 'dmg_0.15|dawn',
  },
  ShadowHarmony: {
    label: 'Dash/Aftershock DMG +15%',
    effectKey: 'dmg_0.15|shadow',
  },
}

function buildEffectGroups(): EffectGroup[] {
  const groups = new Map<string, EffectGroup>()

  for (const [setKey, effects] of Object.entries(disc2pEffect)) {
    const sk = setKey as DiscSetKey
    // Check for label override first
    const override = effectLabelOverrides[sk]
    if (override) {
      if (!groups.has(override.effectKey)) {
        groups.set(override.effectKey, {
          effectKey: override.effectKey,
          label: override.label,
          setKeys: [],
        })
      }
      groups.get(override.effectKey)!.setKeys.push(sk)
      continue
    }

    const entries = Object.entries(effects)
    if (entries.length === 0) continue
    const sorted = [...entries].sort(([a], [b]) => a.localeCompare(b))
    const effectKey = sorted.map(([k, v]) => `${k}_${v}`).join('|')

    if (!groups.has(effectKey)) {
      const label = sorted
        .map(([k, v]) => {
          const name = statKeyTextMap[k] ?? k
          return v < 1 && v > -1
            ? `${name} +${(v * 100).toFixed(0)}%`
            : `${name} +${v}`
        })
        .join('\n')
      groups.set(effectKey, { effectKey, label, setKeys: [] })
    }
    groups.get(effectKey)!.setKeys.push(sk)
  }
  return [...groups.values()]
}

function EffectGrid({
  effectGroups,
  checkedSetKeys,
  onToggle,
  search,
}: {
  effectGroups: EffectGroup[]
  checkedSetKeys: Set<string>
  onToggle: (group: EffectGroup) => void
  search: string
}) {
  const columns = useMemo(() => {
    const cols: EffectGroup[][] = [[], [], [], []]
    effectGroups.forEach((g, i) => cols[i % 4].push(g))
    return cols
  }, [effectGroups])

  const q = search.toLowerCase()
  return (
    <div className={classes.effectGrid}>
      {columns.map((col, ci) => (
        <div key={ci} className={classes.effectGridCol}>
          {col.map((group) => {
            const allChecked = group.setKeys.every((k) => checkedSetKeys.has(k))
            const dimmed =
              !!q &&
              !group.label.toLowerCase().includes(q) &&
              !group.setKeys.some((k) =>
                (discSetNames[k] ?? k).toLowerCase().includes(q)
              )

            return (
              <EffectGroupCard
                key={group.effectKey}
                group={group}
                checked={allChecked}
                dimmed={dimmed}
                onToggle={onToggle}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

const EffectGroupCard = memo(function EffectGroupCard({
  group,
  checked,
  dimmed,
  onToggle,
}: {
  group: EffectGroup
  checked: boolean
  dimmed: boolean
  onToggle: (group: EffectGroup) => void
}) {
  const handleClick = useCallback(() => onToggle(group), [onToggle, group])

  return (
    <UnstyledButton
      className={`${classes.effectCard} ${checked ? classes.effectCardChecked : ''} ${dimmed ? classes.effectCardDimmed : ''}`}
      onClick={handleClick}
    >
      <Text
        size="xs"
        truncate
        fw={checked ? 600 : undefined}
        c={checked ? undefined : 'dimmed'}
      >
        {group.label}
      </Text>
      <Group gap={1} mt={2}>
        {group.setKeys.map((key) => (
          <img
            key={key}
            className={classes.effectSetImg}
            src={discDefIcon(key)}
            alt={discSetNames[key] ?? key}
            title={discSetNames[key] ?? key}
          />
        ))}
        {group.setKeys.length > 1 && (
          <Text size="xs" c="dimmed" style={{ marginLeft: 2, fontSize: 10 }}>
            x{group.setKeys.length}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  )
})
