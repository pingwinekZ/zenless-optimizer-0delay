import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { memo, useCallback, useMemo } from 'react'
import { characterAsset, wengineAsset } from '../../assets'
import type { CharacterKey } from '../../consts'
import { useCharacter } from '../../db-ui'
import { equipDotColor } from '../store'
import classes from './CharacterRow.module.css'
import { CharacterName } from './CharacterTrans'

export type CharacterRowDensity = 'default' | 'compact'

export const rowPresets: Record<CharacterRowDensity, Record<string, string>> = {
  default: {
    '--cr-list-width': '300px',
    '--cr-row-height': '68px',
    '--cr-font-size': '13px',
    '--cr-subtitle-font-size': '12px',
    '--cr-lc-size': '52px',
    '--cr-lc-strip-width': '54px',
    '--cr-portrait-scale': '66%',
    '--cr-portrait-x': '40%',
    '--cr-portrait-y': '30%',
    '--cr-padding': '8px',
    '--cr-gap': '10px',
    '--cr-frost-fade-end': '35%',
    '--cr-frost-mask-solid': '77%',
  },
  compact: {
    '--cr-list-width': '300px',
    '--cr-row-height': '48px',
    '--cr-font-size': '12px',
    '--cr-subtitle-font-size': '11px',
    '--cr-lc-size': '48px',
    '--cr-lc-strip-width': '52px',
    '--cr-portrait-scale': '50%',
    '--cr-portrait-x': '40%',
    '--cr-portrait-y': '32%',
    '--cr-padding': '8px',
    '--cr-gap': '8px',
    '--cr-frost-fade-end': '45%',
    '--cr-frost-mask-solid': '67%',
  },
}

const noop = () => {}

type CharacterRowProps = {
  characterKey: CharacterKey
  rank: number
  isFocused: boolean
  loadImages?: boolean
  onClick?: (characterKey: CharacterKey) => void
  onDoubleClick?: (characterKey: CharacterKey) => void
  onEdit?: (characterKey: CharacterKey) => void
  onDelete?: (characterKey: CharacterKey) => void
  showcaseColor?: string
}

export const CharacterRow = memo(function CharacterRow({
  characterKey,
  rank,
  isFocused,
  loadImages = true,
  onClick,
  onDoubleClick,
  onEdit,
  onDelete,
  showcaseColor,
}: CharacterRowProps) {
  const character = useCharacter(characterKey)
  const wengineKey = character?.wengineKey

  const dotColor = character ? equipDotColor(character.equippedDiscs) : null

  const mindscape = character?.mindscape ?? 0
  const level = character?.level ?? 0
  const promotion = character?.promotion ?? 0

  const hasActions = !!(onEdit || onDelete)

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
  const onClickHandler = useCallback(
    () => onClick?.(characterKey),
    [characterKey, onClick]
  )
  const onDoubleClickHandler = useCallback(
    () => onDoubleClick?.(characterKey),
    [characterKey, onDoubleClick]
  )

  const frameStyle = useMemo(
    () =>
      showcaseColor
        ? {
            backgroundColor: `color-mix(in srgb, ${showcaseColor} 70%, transparent)`,
          }
        : undefined,
    [showcaseColor]
  )

  return (
    <Box
      className={classes.root}
      data-selected={isFocused || undefined}
      onClick={onClickHandler}
      onDoubleClick={onDoubleClickHandler}
    >
      <Box className={classes.frame} style={frameStyle}>
        {/* Portrait background */}
        <Box className={classes.portraitBg}>
          {loadImages && (
            <Box
              component="img"
              src={characterAsset(characterKey, 'general')}
              alt=""
              draggable={false}
              decoding="async"
              onLoad={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                left: 0,
                top: 0,
                transform: 'none',
              }}
            />
          )}
        </Box>

        {/* Frosted scrim */}
        <Box className={classes.scrim} data-scrim-mode="frosted" />

        {/* LC strip (right-side frosted) */}
        <Box className={classes.lcStrip} />

        {/* Inner content */}
        <Box className={classes.inner}>
          {/* Rank / drag grip */}
          <Box className={classes.rankGripSlot}>
            <Text className={classes.rank}>{rank + 1}</Text>
            <Box className={classes.dragGrip}>
              <Box className={classes.gripLine} />
              <Box className={classes.gripLine} />
              <Box className={classes.gripLine} />
            </Box>
          </Box>

          {/* Name + subtitle */}
          <Box className={classes.info} data-name-shadow="true">
            <Text className={classes.name}>
              <CharacterName characterKey={characterKey} />
            </Text>
            <Box className={classes.subtitle}>
              <Text className={classes.subtitleBadge}>M{mindscape}</Text>
              <Text size="10" c="dimmed">
                Lv.{level}/{promotion}
              </Text>
              {dotColor && (
                <Box
                  className={classes.equipDot}
                  style={{
                    width: 5,
                    height: 5,
                    backgroundColor: dotColor === 'red' ? '#903040' : '#b89040',
                  }}
                />
              )}
            </Box>
          </Box>

          {/* W-Engine icon */}
          {wengineKey && (
            <Tooltip label={wengineKey} position="left">
              <Box className={classes.lcWrap} data-lc-style="shadow">
                <Box
                  component="img"
                  src={wengineAsset(wengineKey)}
                  alt=""
                  draggable={false}
                  decoding="async"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                />
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Hover action buttons */}
        {hasActions && (
          <Box className={classes.actions}>
            {onEdit && (
              <Tooltip label="Edit" position="top">
                <ActionIcon
                  className={classes.actionBtn}
                  size={24}
                  variant="subtle"
                  aria-label={`Edit ${characterKey}`}
                  onClick={onEditHandler}
                >
                  <IconEdit size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip label="Delete" position="top">
                <ActionIcon
                  className={classes.actionBtn}
                  size={24}
                  variant="subtle"
                  aria-label={`Delete ${characterKey}`}
                  onClick={onDeleteHandler}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
})

// Drag overlay row — always loads images, no interactivity
export function DragOverlayRow({
  characterKey,
  rank,
}: {
  characterKey: CharacterKey
  rank: number
}) {
  return (
    <Box
      className={classes.root}
      data-dragging="true"
      style={{ cursor: 'grabbing' }}
    >
      <CharacterRow
        characterKey={characterKey}
        rank={rank}
        isFocused={false}
        loadImages={true}
        onClick={noop}
        onEdit={noop}
        onDelete={noop}
      />
    </Box>
  )
}
