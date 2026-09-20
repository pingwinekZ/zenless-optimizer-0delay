import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { IconPencil, IconX } from '@tabler/icons-react'
import { characterAsset, wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { memo, useCallback, useMemo } from 'react'
import classes from './CharacterRow.module.css'

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
    () => (showcaseColor ? { backgroundColor: showcaseColor } : undefined),
    [showcaseColor]
  )

  return (
    <Box
      className={classes.root}
      data-character-id={characterKey}
      data-selected={isFocused || undefined}
      data-scrim-mode="frosted"
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

          {/* Spacer keeps the W-Engine icon pinned right */}
          <Box className={classes.info} />

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
                  <IconPencil size={12} />
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
                  <IconX size={12} />
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
  showcaseColor,
}: {
  characterKey: CharacterKey
  rank: number
  showcaseColor?: string
}) {
  return (
    <Box
      className={classes.root}
      data-dragging="true"
      data-scrim-mode="frosted"
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
        showcaseColor={showcaseColor}
      />
    </Box>
  )
}
