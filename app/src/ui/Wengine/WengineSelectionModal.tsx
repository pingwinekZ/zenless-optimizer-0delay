import { Box, CloseButton, Flex, Text, TextInput } from '@mantine/core'
import { IconStar } from '@tabler/icons-react'
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
          const wengineSortRarityMap = allWengineRarityKeys
          return (
            wengineSortRarityMap.indexOf(getWengineStat(a).rarity) -
            wengineSortRarityMap.indexOf(getWengineStat(b).rarity)
          )
        }),
    [deferredSearchTerm, rarity, tWengine, wengineFilter]
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                gap: 6,
              }}
            >
              {/* Unequip / None option */}
              <SelectionCard
                wengineKey={undefined}
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
 * Fribbels-style wengine selection card:
 * - Icon image with object-position offset
 * - Rarity-based accent border (gold for S, purple for A, blue/grey for B)
 * - Name on solid background at bottom (up to 3 lines)
 * - Hover lift effect
 */
function SelectionCard({
  wengineKey,
  isSignature,
  onClick,
}: {
  wengineKey: WengineKey | undefined
  isSignature?: boolean
  onClick: () => void
}) {
  const stat = wengineKey ? getWengineStat(wengineKey) : undefined
  const rarity = stat?.rarity ?? 'A'

  const rarityColorHex =
    rarity === 'S' ? '#f0b232' : rarity === 'A' ? '#c26cff' : '#5c7cfa'
  const rarityGlow =
    rarity === 'S'
      ? 'rgba(240,178,50,0.35)'
      : rarity === 'A'
        ? 'rgba(194,108,255,0.3)'
        : 'rgba(92,124,250,0.25)'

  const rarityBorder =
    rarity === 'S'
      ? 'rgba(240,178,50,0.4)'
      : rarity === 'A'
        ? 'rgba(194,108,255,0.35)'
        : 'rgba(92,124,250,0.3)'

  return (
    <Box
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'var(--mantine-color-dark-7)',
        border: `1.5px solid ${rarityBorder}`,
        alignSelf: 'start',
        transition:
          'transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s ease, filter 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-4px) scale(1.03)'
        el.style.boxShadow = `0 8px 24px ${rarityGlow}`
        el.style.filter = 'brightness(1.05)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = ''
        el.style.boxShadow = ''
        el.style.filter = ''
      }}
    >
      {wengineKey && stat ? (
        <Flex direction="column" h="100%">
          {/* Rarity accent line at top */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: 2,
              background: `linear-gradient(90deg, transparent, ${rarityColorHex}, transparent)`,
              borderRadius: 1,
              zIndex: 1,
            }}
          />

          {/* Signature weapon badge */}
          {isSignature && (
            <Box
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--mantine-color-yellow-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                zIndex: 1,
              }}
            >
              <IconStar size={11} fill="white" color="white" />
            </Box>
          )}

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

          {/* Name on solid black background — fixed height so all cards are equal */}
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
          {/* Image area matching wengine card aspect ratio */}
          <Box
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--mantine-color-dark-6)',
              flexShrink: 0,
            }}
          >
            <Text size="xl" c="dimmed" fw={700}>
              ✕
            </Text>
          </Box>
          {/* Name bar matching wengine card */}
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
