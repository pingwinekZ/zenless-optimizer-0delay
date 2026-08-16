import { ActionIcon, Badge, Box, Flex, Text, Tooltip } from '@mantine/core'
import { IconEdit, IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { rarityDefIcon, specialityDefIcon, wengineAsset } from '../../assets'
import type { CharacterKey } from '../../consts'
import { allSkillKeys, milestoneMaxLevel } from '../../consts'
import { useCharacter } from '../../db-ui'
import { getCharStat } from '../../stats'
import { ElementIcon } from '../../svgicons'
import type { CharacterGridDensity } from '../store'
import { equipDotColor } from '../store'
import { CharacterName } from './CharacterTrans'

const CHARACTER_IMAGE_URL_BASE =
  'https://act-webstatic.hoyoverse.com/game_record/zzzv2/role_vertical_painting/role_vertical_painting_'

const HEIGHT_MAP: Record<CharacterGridDensity, number> = {
  default: 180,
  compact: 130,
}

const PADDING_MAP: Record<CharacterGridDensity, number> = {
  default: 8,
  compact: 4,
}

export function CharacterCard({
  characterKey,
  onClick,
  onDoubleClick,
  onEdit,
  onDelete,
  onOptimize,
  rank,
  isFocused = false,
  density = 'default',
  style,
}: {
  characterKey: CharacterKey
  onClick?: (characterKey: CharacterKey) => void
  onDoubleClick?: (characterKey: CharacterKey) => void
  onEdit?: (characterKey: CharacterKey) => void
  onDelete?: (characterKey: CharacterKey) => void
  onOptimize?: (characterKey: CharacterKey) => void
  rank?: number
  isFocused?: boolean
  density?: CharacterGridDensity
  style?: CSSProperties
}) {
  const character = useCharacter(characterKey)
  const { level = 0, promotion = 0 } = character ?? {}
  const characterStat = getCharStat(characterKey)
  const { attribute, rarity, specialty, id } = characterStat
  const dotColor = character ? equipDotColor(character.equippedDiscs) : null

  // W-Engine
  const wengineKey = character?.wengineKey

  // Lazy image loading
  const imgRef = useRef<HTMLDivElement | null>(null)
  const [loadImg, setLoadImg] = useState(false)
  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadImg(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const portraitH = HEIGHT_MAP[density]
  const infoP = PADDING_MAP[density]

  const onClickHandler = useCallback(
    () => characterKey && onClick?.(characterKey),
    [characterKey, onClick]
  )

  const onDoubleClickHandler = useCallback(
    () => characterKey && onDoubleClick?.(characterKey),
    [characterKey, onDoubleClick]
  )

  const onEditHandler = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.(characterKey)
    },
    [characterKey, onEdit]
  )

  const onDeleteHandler = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(characterKey)
    },
    [characterKey, onDelete]
  )

  const onOptimizeHandler = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onOptimize?.(characterKey)
    },
    [characterKey, onOptimize]
  )

  const hasActions = !!(onEdit || onDelete)

  return (
    <Box
      ref={imgRef}
      onClick={onClickHandler}
      onDoubleClick={onDoubleClickHandler}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: 'var(--layer-2)',
        boxShadow: isFocused
          ? '0 0 0 2px var(--mantine-primary-color-filled), 0 4px 12px rgba(0,0,0,0.4)'
          : 'var(--shadow-card)',
        transition: 'box-shadow 0.2s, transform 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isFocused) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
        }
        e.currentTarget.style.transform = 'translateY(-1px)'
        const actions = e.currentTarget.querySelector(
          '.character-card-actions'
        ) as HTMLElement | null
        if (actions) actions.style.opacity = '1'
        const scrim = e.currentTarget.querySelector(
          '.character-card-scrim'
        ) as HTMLElement | null
        if (scrim) scrim.style.opacity = '1'
        const grip = e.currentTarget.querySelector(
          '.character-card-grip'
        ) as HTMLElement | null
        if (grip) grip.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isFocused
          ? '0 0 0 2px var(--mantine-primary-color-filled), 0 4px 12px rgba(0,0,0,0.4)'
          : 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
        const actions = e.currentTarget.querySelector(
          '.character-card-actions'
        ) as HTMLElement | null
        if (actions) actions.style.opacity = '0'
        const scrim = e.currentTarget.querySelector(
          '.character-card-scrim'
        ) as HTMLElement | null
        if (scrim) scrim.style.opacity = '0'
        const grip = e.currentTarget.querySelector(
          '.character-card-grip'
        ) as HTMLElement | null
        if (grip) grip.style.opacity = '0'
      }}
    >
      {/* Portrait background */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: portraitH,
          background: attribute
            ? `var(--mantine-color-${attribute}-8)`
            : 'var(--layer-2)',
          overflow: 'hidden',
        }}
      >
        {loadImg && (
          <Box
            component="img"
            src={`${CHARACTER_IMAGE_URL_BASE}${id}.png`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        )}

        {/* Frosted glass scrim (hover) */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            opacity: 0,
            transition: 'opacity 0.2s',
            backdropFilter: 'blur(6px) brightness(0.8) saturate(1.2)',
            WebkitBackdropFilter: 'blur(6px) brightness(0.8) saturate(1.2)',
            maskImage:
              'linear-gradient(90deg, black 0%, black 77%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(90deg, black 0%, black 77%, transparent 100%)',
            pointerEvents: 'none',
          }}
          className="character-card-scrim"
        />

        {/* Bottom scrim overlay */}
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }}
        />

        {/* Rank number / Grip (rank visible by default, grip on hover) */}
        {rank !== undefined && (
          <>
            <Box
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 2,
                fontFamily: 'Consolas, Menlo, Monaco, monospace',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                lineHeight: 1,
              }}
              className="character-card-rank"
            >
              {rank + 1}
            </Box>
            <Flex
              className="character-card-grip"
              gap={1}
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 2,
                opacity: 0,
                transition: 'opacity 0.15s',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                width: 16,
              }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  style={{
                    width: 12,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                  }}
                />
              ))}
            </Flex>
          </>
        )}

        {/* Top-right skill badges */}
        <Flex
          gap={2}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
          }}
        >
          {allSkillKeys.map((skill, i) => (
            <Badge
              key={i}
              size="xs"
              variant="filled"
              color="dark"
              style={{ padding: '0 2px', minWidth: 18, textAlign: 'center' }}
            >
              {character?.[skill]}
            </Badge>
          ))}
        </Flex>

        {/* W-Engine icon overlay (right side) */}
        {wengineKey && (
          <Tooltip label={wengineKey} position="left">
            <Box
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                zIndex: 2,
                width: density === 'compact' ? 28 : 36,
                height: density === 'compact' ? 28 : 36,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              <Box
                component="img"
                src={wengineAsset(wengineKey)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Tooltip>
        )}

        {/* Equip dot */}
        {dotColor && (
          <Box
            style={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: dotColor === 'red' ? '#903040' : '#b89040',
            }}
          />
        )}

        {/* Hover action buttons */}
        {hasActions && (
          <Flex
            gap={4}
            className="character-card-actions"
            style={{
              position: 'absolute',
              top: 4,
              left: 28,
              zIndex: 3,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          >
            {onEdit && (
              <Tooltip label="Edit">
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="sm"
                  onClick={onEditHandler}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label="Delete">
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="sm"
                  onClick={onDeleteHandler}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            {onOptimize && (
              <Tooltip label="Optimize">
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="sm"
                  onClick={onOptimizeHandler}
                >
                  <IconPlayerPlay size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Flex>
        )}
      </Box>

      {/* Info section */}
      <Box p={infoP}>
        <Flex align="center" gap={4} mb={density === 'compact' ? 0 : 4}>
          <ImgIcon
            size={density === 'compact' ? 1 : 1.2}
            src={rarityDefIcon(rarity)}
          />
          <Text
            fw={700}
            size={density === 'compact' ? 'xs' : 'sm'}
            style={{
              lineHeight: 1.2,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <CharacterName characterKey={characterKey} />
          </Text>
        </Flex>
        <Flex align="center" gap={4}>
          <ElementIcon
            ele={attribute}
            iconProps={{
              style: { fontSize: density === 'compact' ? '0.9em' : '1.1em' },
            }}
          />
          <ImgIcon
            size={density === 'compact' ? 0.9 : 1.1}
            src={specialityDefIcon(specialty)}
          />
          <Text size={density === 'compact' ? '10' : 'xs'} c="dark.2" ml="auto">
            Lv.{level}/{milestoneMaxLevel[promotion]}
          </Text>
        </Flex>
        {character && (
          <Flex align="center" gap={4} mt={2}>
            <Badge
              size="xs"
              variant="filled"
              color="dark"
              style={{ fontWeight: 600 }}
            >
              M{character.mindscape}
            </Badge>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
