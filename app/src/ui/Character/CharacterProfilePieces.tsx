import { Box, Text, Title } from '@mantine/core'
import { ImgIcon, SqBadge } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { useTranslation } from 'react-i18next'
import { characterAsset, rarityDefIcon, specialityDefIcon } from '../../assets'
import {
  type CharacterKey,
  getLevelString,
  type MilestoneKey,
} from '../../consts'
import type { ICachedCharacter } from '../../db'
import { getCharStat } from '../../stats'
import { ElementIcon } from '../../svgicons'
import { MindscapesSwitch, ZCard } from '../Components'
import { CharacterName } from './CharacterTrans'

export function CharacterCompactMindscapeSelector({
  mindscape,
  setMindscape,
}: {
  mindscape: number
  setMindscape: (mindscape: number) => void
}) {
  const { t } = useTranslation('page_characters')

  return (
    <Box
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
      }}
    >
      {range(1, 6).map((i) => (
        <Box key={i}>
          <ZCard style={{ position: 'relative', borderRadius: '40px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              <MindscapesSwitch
                checked={mindscape >= i}
                onChange={() => setMindscape(i === mindscape ? i - 1 : i)}
              />
              <Box
                style={{
                  position: 'absolute',
                  top: 9,
                  left: mindscape >= i ? 75 : 16,
                  transition: 'left 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                  textAlign: 'center',
                }}
              >
                <Text
                  size="md"
                  style={{
                    fontWeight: 900,
                    color:
                      mindscape >= i
                        ? 'var(--mantine-color-mindscapeActive-5)'
                        : 'var(--mantine-color-mindscapeInactive-5)',
                  }}
                >
                  {t('mindscape', { level: i })}
                </Text>
                <Text
                  size="sm"
                  style={{
                    lineHeight: 0.2,
                    fontWeight: 900,
                    color:
                      mindscape >= i
                        ? 'var(--mantine-color-mindscapeActive-5)'
                        : 'var(--mantine-color-mindscapeInactive-5)',
                  }}
                >
                  {t('mindscapeTitle')}
                </Text>
              </Box>
            </label>
          </ZCard>
        </Box>
      ))}
    </Box>
  )
}

export function CharacterCoverArea({
  character: { level, promotion, key: characterKey },
}: {
  character: ICachedCharacter
}) {
  return (
    <CoverArea
      level={level}
      promotion={promotion}
      characterKey={characterKey}
    />
  )
}

function CoverArea({
  characterKey,
  level,
  promotion,
}: {
  characterKey: CharacterKey
  level: number
  promotion: MilestoneKey
}) {
  const { rarity } = getCharStat(characterKey)

  return (
    <Box style={{ display: 'flex', position: 'relative' }}>
      <Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <Title
          order={6}
          style={{
            position: 'absolute',
            width: '100%',
            left: '50%',
            bottom: 0,
            transform: 'translate(-50%, -50%)',
            opacity: 1,
            textAlign: 'center',
          }}
        >
          {<ImgIcon size={1.5} src={rarityDefIcon(rarity)} />}
        </Title>
        <Box
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '7%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.85,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            paddingLeft: '4px',
            paddingRight: '4px',
          }}
        >
          <CharChip characterKey={characterKey} />
        </Box>
        <LevelBadge level={level} promotion={promotion} />
      </Box>
      <Box
        src={characterAsset(characterKey, 'full')}
        component="img"
        width="100%"
        height="auto"
      ></Box>
    </Box>
  )
}

function CharChip({ characterKey }: { characterKey: CharacterKey }) {
  const { attribute, specialty } = getCharStat(characterKey)
  return (
    <Box
      style={{
        background: `var(--mantine-color-${attribute}-5)`,
        height: 'auto',
        padding: '4px 12px',
        borderRadius: '16px',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Box style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <ElementIcon ele={attribute} />
        <Box style={{ whiteSpace: 'normal', textAlign: 'center' }}>
          <Text size="md">
            <CharacterName characterKey={characterKey} />
          </Text>
        </Box>
        <ImgIcon size={1.5} src={specialityDefIcon(specialty)} />
      </Box>
    </Box>
  )
}
function LevelBadge({
  level,
  promotion,
}: {
  level: number
  promotion: MilestoneKey
}) {
  return (
    <Text
      style={{
        padding: '4px',
        position: 'absolute',
        right: 0,
        top: 0,
        opacity: 0.8,
      }}
    >
      <SqBadge>{getLevelString(level, promotion)}</SqBadge>
    </Text>
  )
}
