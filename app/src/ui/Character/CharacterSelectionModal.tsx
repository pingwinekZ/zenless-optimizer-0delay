import { Box, CloseButton, Flex, Text, TextInput } from '@mantine/core'
import { useDataEntryBase } from '@zenless-optimizer/common/database-ui'
import { ImgIcon, ModalWrapper } from '@zenless-optimizer/common/ui'
import { filterFunction } from '@zenless-optimizer/common/util'
import type { ChangeEvent, CSSProperties } from 'react'
import { Suspense, useDeferredValue, useMemo, useRef, useState } from 'react'
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
              }}
            >
              {showNone && (
                <SelectionCard
                  characterKey={undefined}
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
  onClick,
}: {
  characterKey: CharacterKey | undefined
  onClick: () => void
}) {
  const { t } = useTranslation(['page_characters', 'charNames_gen'])
  const stat = characterKey ? getCharStat(characterKey) : undefined
  const rarity = stat?.rarity ?? 'A'
  const isS = rarity === 'S'

  const rarityColor = isS ? '#f0b232' : '#c26cff'
  const rarityGlow = isS ? 'rgba(240,178,50,0.35)' : 'rgba(194,108,255,0.3)'
  const rarityBg = isS
    ? 'linear-gradient(160deg, rgba(240,178,50,0.12) 0%, rgba(240,178,50,0.04) 100%)'
    : 'linear-gradient(160deg, rgba(194,108,255,0.10) 0%, rgba(194,108,255,0.03) 100%)'

  const cardWidth = 130
  const cardHeight = Math.round(cardWidth * 1.15)
  const skewPct = 28 // percent offset for parallelogram lean
  const hOverlap = Math.round((cardWidth * skewPct) / 100)

  const baseStyle: CSSProperties = {
    cursor: 'pointer',
    position: 'relative',
    width: cardWidth,
    flexShrink: 0,
    marginRight: characterKey ? -hOverlap : 0,
    transition: 'transform 0.2s cubic-bezier(.4,0,.2,1), filter 0.2s ease',
    zIndex: 1,
  }

  const outerRef = useRef<HTMLDivElement>(null)

  if (!characterKey || !stat) {
    return (
      <Box style={baseStyle} onClick={onClick}>
        <Box
          style={{
            width: cardWidth,
            aspectRatio: '1 / 1.15',
            borderRadius: 12,
            border: '2px dashed rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <Text size="xl" c="dimmed">
            —
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box ref={outerRef} style={baseStyle}>
      {/* Rarity glow backdrop — sits naturally outside clip-path */}
      <Box
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 16,
          background: rarityBg,
          filter: 'blur(8px)',
          opacity: 0.8,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Card frame — clip-path creates the parallelogram lean.
          Event handlers live here so the hit-area matches the visual shape. */}
      <Box
        style={{
          position: 'relative',
          width: cardWidth,
          height: cardHeight,
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${isS ? 'rgba(240,178,50,0.08)' : 'rgba(194,108,255,0.06)'} 0%, rgba(12,12,16,0.6) 50%, rgba(8,8,12,0.95) 100%)`,
          border: `1.5px solid ${isS ? 'rgba(240,178,50,0.4)' : 'rgba(194,108,255,0.35)'}`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
          clipPath: `polygon(0% 0%, ${100 - skewPct}% 0%, 100% 100%, ${skewPct}% 100%)`,
          cursor: 'pointer',
        }}
        onClick={onClick}
        onMouseEnter={() => {
          const el = outerRef.current
          if (!el) return
          el.style.transform = 'translateY(-6px) scale(1.05)'
          el.style.zIndex = '10'
          el.style.filter = `drop-shadow(0 8px 24px ${rarityGlow})`
        }}
        onMouseLeave={() => {
          const el = outerRef.current
          if (!el) return
          el.style.transform = ''
          el.style.zIndex = ''
          el.style.filter = ''
        }}
      >
        {/* Character portrait — transparent PNG, natural silhouette */}
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
            objectPosition: '50% 15%',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Top rarity accent line */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)`,
            borderRadius: 1,
          }}
        />

        {/* Name plate — solid black bar at the bottom.
            Left padding offsets the parallelogram skew so text sits within the visible area. */}
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#000',
            padding: `6px 8px 6px ${skewPct}%`,
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
  )
}
