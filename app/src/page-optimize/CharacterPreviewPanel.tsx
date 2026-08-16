import { Box, Flex, Text } from '@mantine/core'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { useCallback } from 'react'
import { characterAsset, wengineAsset } from '../assets'
import type { CharacterKey, WengineKey } from '../consts'
import { useCharacter } from '../db-ui'
import { getCharStat } from '../stats'
import { CharacterSingleSelectionModal, WengineSelectionModal } from '../ui'

const containerW = 248
const cardGap = 10
const lcCardH = 85
const formCardH = 415
const charCardH = formCardH - lcCardH - cardGap
const cardStyle: React.CSSProperties = {
  borderRadius: 6,
  backgroundColor: 'var(--layer-2)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
}

export function CharacterPreviewPanel({
  characterKey,
  onCharacterChange,
  onWengineChange,
}: {
  characterKey: CharacterKey
  onCharacterChange: (ck: CharacterKey) => void
  onWengineChange: (wengineKey: WengineKey | '') => void
}) {
  const character = useCharacter(characterKey)
  const charStat = getCharStat(characterKey)

  const wengineKey: WengineKey | '' = character?.wengineKey || ''

  const [showCharModal, onShowCharModal, onHideCharModal] = useBoolState()
  const [showWengineModal, onShowWengineModal, onHideWengineModal] =
    useBoolState()

  const setWengineKey = useCallback(
    (wKey: WengineKey | '') => {
      onWengineChange(wKey)
    },
    [onWengineChange]
  )

  const bgColor = charStat.attribute
    ? `var(--mantine-color-${charStat.attribute}-8)`
    : 'var(--layer-2)'

  return (
    <Flex direction="column" gap={cardGap} style={{ width: containerW }}>
      <CharacterSingleSelectionModal
        show={showCharModal}
        onHide={onHideCharModal}
        onSelect={(ck) => ck && onCharacterChange(ck)}
      />
      <WengineSelectionModal
        show={showWengineModal}
        onHide={onHideWengineModal}
        onSelect={(wKey) => setWengineKey(wKey)}
        wengineTypeFilter={charStat.specialty}
        characterKey={characterKey}
      />

      {/* Character art card — clicking opens character select modal */}
      <div
        style={{
          ...cardStyle,
          width: containerW,
          height: charCardH,
          position: 'relative',
          backgroundColor: bgColor,
          cursor: 'pointer',
        }}
        onClick={onShowCharModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onShowCharModal()
        }}
      >
        <Box
          component="img"
          src={characterAsset(characterKey, 'full')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center top',
            filter: 'brightness(1.05) saturate(1.05)',
          }}
        />
      </div>

      {/* W-Engine card — matching fribbels (no overlays, zoomed icon) */}
      <div
        style={{
          ...cardStyle,
          width: containerW,
          height: lcCardH,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
        onClick={onShowWengineModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onShowWengineModal()
        }}
      >
        {wengineKey ? (
          <Box
            style={{
              transform: 'scale(1.15)',
              overflow: 'hidden',
              filter: 'brightness(0.95) saturate(0.9)',
            }}
          >
            <Box
              component="img"
              src={wengineAsset(wengineKey)}
              style={{
                height: lcCardH - 10,
                width: 'auto',
              }}
            />
          </Box>
        ) : (
          <Text size="xs" c="dimmed">
            No W-Engine
          </Text>
        )}
      </div>
    </Flex>
  )
}
