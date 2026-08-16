import { Box, CloseButton, Flex, Text, TextInput } from '@mantine/core'
import { useDataEntryBase } from '@zenless-optimizer/common/database-ui'
import { ImgIcon, ModalWrapper } from '@zenless-optimizer/common/ui'
import type { ChangeEvent } from 'react'
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { rarityDefIcon, specialityDefIcon, wengineAsset } from '../../assets'
import type { CharacterKey, SpecialityKey, WengineKey } from '../../consts'
import {
  allSpecialityKeys,
  allWengineKeys,
  allWengineRarityKeys,
} from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { characterKeyToWengineKey, getWengineStat } from '../../stats'
import { SegmentedFilterRow } from '../toggles'
import { WengineName } from './WengineTrans'

type WengineSelectionModalProps = {
  show: boolean
  onHide: () => void
  onSelect: (wKey: WengineKey | '') => void
  wengineTypeFilter?: SpecialityKey | ''
  characterKey?: CharacterKey
  zIndex?: number
}

export function WengineSelectionModal({
  show,
  onHide,
  onSelect,
  wengineTypeFilter,
  characterKey,
  zIndex,
}: WengineSelectionModalProps) {
  const { t: tWengine } = useTranslation('wengineNames_gen')
  const { database } = useDatabaseContext()
  const displayWengine = useDataEntryBase(database.displayWengine)

  const [wengineFilter, setWenginefilter] = useState<SpecialityKey[]>(
    wengineTypeFilter ? [wengineTypeFilter] : [...allSpecialityKeys]
  )

  const handleSetWengineFilter = useCallback((keys: SpecialityKey[]) => {
    // Single-select: only the last selected key
    setWenginefilter(keys.length > 1 ? [keys[keys.length - 1]] : keys)
  }, [])

  // Sync external wengineTypeFilter changes
  useEffect(() => {
    if (wengineTypeFilter) {
      setWenginefilter([wengineTypeFilter])
    }
  }, [wengineTypeFilter])

  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const { rarity } = displayWengine

  const sigWengineKey = useMemo(
    () => (characterKey ? characterKeyToWengineKey[characterKey] : undefined),
    [characterKey]
  )

  const wengineIdList = useMemo(
    () =>
      allWengineKeys
        .filter(
          (wKey) =>
            !wengineFilter.length ||
            wengineFilter.includes(getWengineStat(wKey).type)
        )
        .filter(
          (wKey) =>
            !deferredSearchTerm ||
            tWengine(`${wKey}`)
              .toLowerCase()
              .includes(deferredSearchTerm.toLowerCase())
        )
        .filter(
          (wKey) =>
            !rarity.length || rarity.includes(getWengineStat(wKey).rarity)
        )
        .sort((a, b) => {
          if (a === sigWengineKey) return -1
          if (b === sigWengineKey) return 1
          const wengineSortRarityMap = allWengineRarityKeys
          return (
            wengineSortRarityMap.indexOf(getWengineStat(a).rarity) -
            wengineSortRarityMap.indexOf(getWengineStat(b).rarity)
          )
        }),
    [deferredSearchTerm, rarity, sigWengineKey, tWengine, wengineFilter]
  )

  return (
    <ModalWrapper
      opened={show}
      onClose={onHide}
      zIndex={zIndex}
      size="75%"
      containerProps={{
        style: {
          height: '70%',
          maxWidth: 1200,
          minHeight: 'min(910px, 90dvh)',
        },
      }}
    >
      <Flex direction="column" style={{ height: '100%', overflow: 'hidden' }}>
        {/* ─── Filter bar ─── */}
        <Box p="md" pb={0}>
          <Flex gap="sm" wrap="wrap" align="center">
            {/* Search */}
            <TextInput
              styles={{
                input: {
                  height: 40,
                  lineHeight: '40px',
                  fontSize: 14,
                  borderRadius: 4,
                },
              }}
              w={200}
              placeholder="W-Engine"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              rightSection={
                searchTerm ? (
                  <CloseButton size="sm" onClick={() => setSearchTerm('')} />
                ) : undefined
              }
              rightSectionPointerEvents="all"
            />

            {/* Specialty/Class filters */}
            <Box style={{ flex: '1 1 0', minWidth: 240 }}>
              <SegmentedFilterRow
                tags={allSpecialityKeys.map((sk) => ({
                  key: sk,
                  display: <ImgIcon src={specialityDefIcon(sk)} size={1.5} />,
                  flexBasis: `${100 / allSpecialityKeys.length}%`,
                }))}
                currentFilter={wengineFilter}
                setCurrentFilters={handleSetWengineFilter}
              />
            </Box>

            {/* Rarity filters */}
            <Box style={{ flex: '0 0 200px' }}>
              <SegmentedFilterRow
                tags={allWengineRarityKeys.map((rk) => ({
                  key: rk,
                  display: <ImgIcon src={rarityDefIcon(rk)} size={1.2} />,
                  flexBasis: `${100 / allWengineRarityKeys.length}%`,
                }))}
                currentFilter={rarity}
                setCurrentFilters={(keys) =>
                  database.displayWengine.set({
                    rarity: keys.length > 1 ? [keys[keys.length - 1]] : keys,
                  })
                }
              />
            </Box>
          </Flex>
        </Box>

        {/* ─── W-Engine card grid ─── */}
        <Box style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <Suspense fallback={null}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 0,
              }}
            >
              {/* Unequip / None option */}
              <SelectionCard
                wengineKey={undefined}
                isHovered={hoveredKey === 'none'}
                onHoverStart={() => setHoveredKey('none')}
                onHoverEnd={() => setHoveredKey(null)}
                onClick={() => {
                  onHide()
                  onSelect('')
                }}
              />
              {wengineIdList.map((wengineKey) => (
                <SelectionCard
                  key={wengineKey}
                  wengineKey={wengineKey}
                  isSignature={wengineKey === sigWengineKey}
                  isHovered={hoveredKey === wengineKey}
                  onHoverStart={() => setHoveredKey(wengineKey)}
                  onHoverEnd={() => setHoveredKey(null)}
                  onClick={() => {
                    onHide()
                    onSelect(wengineKey)
                  }}
                />
              ))}
            </Box>
          </Suspense>
        </Box>
      </Flex>
    </ModalWrapper>
  )
}

/**
 * W-Engine selection card matching character modal style.
 * Square grid layout with rarity gradient nameplate and hover lift.
 */
function SelectionCard({
  wengineKey,
  isSignature,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  wengineKey: WengineKey | undefined
  isSignature?: boolean
  isHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onClick: () => void
}) {
  const stat = wengineKey ? getWengineStat(wengineKey) : undefined
  const rarity = stat?.rarity ?? 'A'

  const rarityGradient =
    rarity === 'S'
      ? 'linear-gradient(to bottom, #cc7a00, #b34700)'
      : rarity === 'A'
        ? 'linear-gradient(to bottom, #cc30cc, #7a1a7a)'
        : 'linear-gradient(to bottom, #00a8cc, #1a5fb4)'

  return (
    <Box
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: isSignature ? '#aa2138ff' : '#0c0c14',
        border: isSignature ? '1.5px solid #000000ff' : '1px solid #000',
        alignSelf: 'start',
        transition: 'transform 0.2s cubic-bezier(.4,0,.2,1)',
        zIndex: isHovered ? 10 : 1,
        transform: isHovered ? 'translateY(-4px) scale(1.03)' : undefined,
      }}
    >
      {wengineKey && stat ? (
        <Flex direction="column" h="100%">
          {/* W-Engine icon */}
          <Box
            component="img"
            src={wengineAsset(wengineKey)}
            alt=""
            loading="lazy"
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              objectPosition: '50% 50%',
              flexShrink: 0,
            }}
          />

          {/* Name on gradient background */}
          <Box
            style={{
              background: rarityGradient,
              padding: '5px 6px',
              minHeight: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Text
              size="xs"
              ta="center"
              lineClamp={2}
              style={{
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              <WengineName wKey={wengineKey} />
            </Text>
          </Box>
        </Flex>
      ) : (
        /* Empty slot for "Unequip" option */
        <Flex direction="column" h="100%">
          <Box
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0c0c14',
              flexShrink: 0,
            }}
          >
            <Text size="xl" c="dimmed" fw={700}>
              ✕
            </Text>
          </Box>
          <Box
            style={{
              background: '#000',
              padding: '5px 6px',
              minHeight: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Text
              size="xs"
              ta="center"
              style={{
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Unequip
            </Text>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
