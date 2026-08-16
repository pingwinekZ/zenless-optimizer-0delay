import { Box, CloseButton, Flex, Text, TextInput } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useDataEntryBase } from '@zenless-optimizer/common/database-ui'
import { ImgIcon, ModalWrapper } from '@zenless-optimizer/common/ui'
import { filterFunction } from '@zenless-optimizer/common/util'
import type { ChangeEvent, CSSProperties } from 'react'
import { Suspense, useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { characterAsset, specialityDefIcon } from '../../assets'
import type { AttributeKey, CharacterKey, SpecialityKey } from '../../consts'
import {
  allAttributeKeys,
  allCharacterKeys,
  allSpecialityKeys,
} from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { getCharStat } from '../../stats'
import { ElementIcon } from '../../svgicons'
import { SegmentedFilterRow } from '../toggles'
import { characterFilterConfigs } from './CharacterSort'

// Card layout constants
const CARD_WIDTH = 160
const CARD_HEIGHT = 161
// Visual skew — matches the actual select.webp art shape
const CLIP_SKEW_PCT = 31
// Layout overlap — slightly exceed CLIP_SKEW_PCT to close gaps between clipped edges
const LAYOUT_OVERLAP_PCT = 32
const H_OVERLAP = Math.round((CARD_WIDTH * LAYOUT_OVERLAP_PCT) / 100)

export function CharacterSingleSelectionModal({
  show,
  onHide,
  onSelect,
  showNone = false,
}: {
  show: boolean
  onHide: () => void
  onSelect: (cKey: CharacterKey | null) => void
  showNone?: boolean
}) {
  const { database } = useDatabaseContext()
  const displayCharacter = useDataEntryBase(database.displayCharacter)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const deferredState = useDeferredValue(displayCharacter)
  const [attributeFilter, setAttributeFilter] = useState<AttributeKey[]>([])
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialityKey[]>([])
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const characterKeyList = useMemo(() => {
    const { rarity } = deferredState
    const filteredKeys = allCharacterKeys.filter(
      filterFunction(
        {
          attribute: attributeFilter,
          specialtyType: specialtyFilter,
          rarity,
          name: deferredSearchTerm,
        },
        characterFilterConfigs(database)
      )
    )
    return filteredKeys
  }, [
    deferredState,
    deferredSearchTerm,
    database,
    attributeFilter,
    specialtyFilter,
  ])

  const onClose = () => {
    setSearchTerm('')
    onHide()
  }

  return (
    <ModalWrapper
      opened={show}
      onClose={onClose}
      size="75%"
      containerProps={{
        style: {
          height: '80%',
          maxWidth: 1450,
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
              placeholder="Search character name"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value.toLowerCase())
              }
              rightSection={
                searchTerm ? (
                  <CloseButton size="sm" onClick={() => setSearchTerm('')} />
                ) : undefined
              }
              rightSectionPointerEvents="all"
            />

            {/* Element filters */}
            <Box style={{ flex: '1 1 0', minWidth: 280 }}>
              <SegmentedFilterRow
                tags={allAttributeKeys.map((atr) => ({
                  key: atr,
                  display: (
                    <ElementIcon
                      ele={atr}
                      iconProps={{ style: { fontSize: '1.3rem' } }}
                    />
                  ),
                  flexBasis: `${100 / allAttributeKeys.length}%`,
                }))}
                singleSelect
                currentFilter={attributeFilter}
                setCurrentFilters={(attribute) => setAttributeFilter(attribute)}
              />
            </Box>

            {/* Specialty/Class filters */}
            <Box style={{ flex: '1 1 0', minWidth: 240 }}>
              <SegmentedFilterRow
                tags={allSpecialityKeys.map((sk) => ({
                  key: sk,
                  display: <ImgIcon src={specialityDefIcon(sk)} size={1.5} />,
                  flexBasis: `${100 / allSpecialityKeys.length}%`,
                }))}
                singleSelect
                currentFilter={specialtyFilter}
                setCurrentFilters={(specialtyType) =>
                  setSpecialtyFilter(specialtyType)
                }
              />
            </Box>
          </Flex>
        </Box>

        {/* ─── Character card grid ─── */}
        <Box style={{ flex: 1, overflow: 'auto', padding: '12px 16px 24px' }}>
          <Suspense fallback={null}>
            <Box
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                paddingRight: H_OVERLAP,
              }}
            >
              {showNone && (
                <SelectionCard
                  characterKey={undefined}
                  isHovered={hoveredKey === 'none'}
                  onHoverStart={() => setHoveredKey('none')}
                  onHoverEnd={() => setHoveredKey(null)}
                  onClick={() => {
                    onHide()
                    onSelect(null)
                  }}
                />
              )}
              {characterKeyList.map((characterKey) => (
                <SelectionCard
                  key={characterKey}
                  characterKey={characterKey}
                  isHovered={hoveredKey === characterKey}
                  onHoverStart={() => setHoveredKey(characterKey)}
                  onHoverEnd={() => setHoveredKey(null)}
                  onClick={() => {
                    onHide()
                    onSelect(characterKey)
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
 * Character selection card with rarity accent and transparent PNG silhouette.
 * Renders the character's 'select' asset with object-fit: contain so the
 * natural silhouette shape shows through against the dark gradient background.
 */
function SelectionCard({
  characterKey,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  characterKey: CharacterKey | undefined
  isHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onClick: () => void
}) {
  const { t } = useTranslation(['page_characters', 'charNames_gen'])
  const stat = characterKey ? getCharStat(characterKey) : undefined
  const rarity = stat?.rarity ?? 'A'
  const isS = rarity === 'S'

  const rarityGradient = isS
    ? 'linear-gradient(to bottom, #cc7a00, #b34700)'
    : 'linear-gradient(to bottom, #cc30cc, #7a1a7a)'

  const cardWidth = CARD_WIDTH
  const cardHeight = CARD_HEIGHT
  const clipSkewPct = CLIP_SKEW_PCT
  const hOverlap = H_OVERLAP

  const clipPolygon = `polygon(1.5% 0%, ${100 - clipSkewPct}% 0%, 98.5% 100%, ${clipSkewPct}% 100%)`

  const baseStyle: CSSProperties = {
    cursor: 'pointer',
    position: 'relative',
    width: cardWidth,
    flexShrink: 0,
    marginRight: -hOverlap,
    transition: 'transform 0.2s cubic-bezier(.4,0,.2,1)',
    zIndex: isHovered ? 10 : 1,
    transform: isHovered ? 'translateY(-6px) scale(1.05)' : undefined,
    clipPath: clipPolygon,
  }

  if (!characterKey || !stat) {
    return (
      <Box
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
        <Box
          style={{
            position: 'relative',
            width: cardWidth,
            height: cardHeight,
            background: '#0c0c14',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 2,
              right: 2,
              overflow: 'hidden',
              background: '#0c0c14',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              border: '1px dashed rgba(255,255,255,0.15)',
            }}
          >
            <IconX size={34} stroke={1.5} />
            <Text size="xs" c="dimmed" fw={600}>
              {t('unequip')}
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  const borderWidth = 2

  return (
    <Box
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <Box
        style={{
          position: 'relative',
          width: cardWidth,
          height: cardHeight,
          background: '#0c0c14',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: borderWidth,
            right: borderWidth,
            overflow: 'hidden',
            background: '#0c0c14',
          }}
        >
          <Box
            component="img"
            src={characterAsset(characterKey, 'select')}
            alt=""
            loading="lazy"
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: '55% 0%',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />

          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: rarityGradient,
              padding: `6px 8px 6px ${clipSkewPct}%`,
            }}
          >
            <Text
              size="xs"
              fw={700}
              ta="center"
              lineClamp={2}
              style={{
                color: '#fff',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {t(`charNames_gen:${characterKey}`)}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
