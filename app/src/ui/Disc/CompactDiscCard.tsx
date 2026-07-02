import { Box, Skeleton, Text } from '@mantine/core'
import { IconBriefcase } from '@tabler/icons-react'
import {
  CardThemed,
  ColorText,
  ConditionalWrapper,
  ImgIcon,
} from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type { ReactNode } from 'react'
import { Suspense, useCallback, useContext } from 'react'
import { characterAsset, discDefIcon } from '../../assets'
import type { DiscRarityKey, DiscSlotKey } from '../../consts'
import {
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  rarityColor,
} from '../../consts'
import type { ICachedDisc } from '../../db'
import { SlotIcon, StatIcon } from '../../svgicons'
import type { ISubstat } from '../../zood'
import { ZCard } from '../Components'
import { getHighlightRGBA, isHighlight, StatHighlightContext } from '../context'
import { COMPACT_CARD_HEIGHT_PX, EmptyCompactCard } from '../util'
import { useSpinner } from './util'

export function CompactDiscCard({
  disc,
  slotKey,
  onClick,
}: {
  disc?: ICachedDisc
  slotKey: DiscSlotKey
  onClick?: () => void
}) {
  const {
    rotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
  } = useSpinner()

  const { statHighlight, setStatHighlight } = useContext(StatHighlightContext)
  const isHL = disc?.mainStatKey
    ? isHighlight(statHighlight, disc?.mainStatKey)
    : false
  const location = disc?.location

  const wrapperFunc = useCallback(
    (children: ReactNode) => (
      <Box onClick={onClick} style={{ cursor: 'pointer', borderRadius: 0 }}>
        {children}
      </Box>
    ),
    [onClick]
  )
  const falseWrapperFunc = useCallback(
    (children: ReactNode) => <Box>{children}</Box>,
    []
  )

  return disc ? (
    <ZCard bgt="dark">
      <Suspense
        fallback={
          <Skeleton width="100%" height={`${COMPACT_CARD_HEIGHT_PX}px`} />
        }
      >
        <ConditionalWrapper
          condition={!!onClick}
          wrapper={wrapperFunc}
          falseWrapper={falseWrapperFunc}
        >
          <Box
            style={{
              display: 'flex',
              padding: 4,
              height: `${COMPACT_CARD_HEIGHT_PX}px`,
            }}
          >
            <CardThemed bgt="light" style={{ borderRadius: '12px' }}>
              <Box
                style={{
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative',
                }}
              >
                <Box
                  style={{
                    height: 0,
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    zIndex: 1,
                  }}
                >
                  {location ? (
                    <ImgIcon
                      src={characterAsset(location, 'circle')}
                      style={{
                        border: `4px solid ${rarityColor[disc.rarity]}`,
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        border: `4px solid ${rarityColor[disc.rarity]}`,
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        background: 'var(--mantine-color-gray-7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingBottom: '1px',
                      }}
                    >
                      <IconBriefcase size={18} />
                    </Box>
                  )}
                </Box>
                <Box
                  style={{
                    border: `4px solid ${rarityColor[disc.rarity]}`,
                    borderRadius: '50%',
                  }}
                >
                  <Box
                    onMouseDown={(e: React.MouseEvent) =>
                      handleMouseDown(e.nativeEvent)
                    }
                    onMouseMove={(e: React.MouseEvent) =>
                      handleMouseMove(e.nativeEvent)
                    }
                    onMouseUp={(e: React.MouseEvent) =>
                      handleMouseUp(e.nativeEvent)
                    }
                    onMouseLeave={(e: React.MouseEvent) =>
                      handleMouseUp(e.nativeEvent)
                    }
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderRadius: '50%',
                      border: `4px solid #1B263B`,
                    }}
                  >
                    <Box
                      component="img"
                      alt="Disc Piece Image"
                      src={discDefIcon(disc.setKey)}
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        width: 'auto',
                        float: 'right',
                        height: '92px',
                        transition: isDragging
                          ? 'none'
                          : 'transform 0.1s ease-out',
                      }}
                    />

                    <Box
                      style={{
                        height: 0,
                        position: 'absolute',
                        bottom: '66px',
                      }}
                    >
                      <SlotIcon
                        slotKey={disc.slotKey}
                        iconProps={{
                          style: {
                            border: '1px solid #1B263B',
                            background: '#1B263B',
                            borderRadius: '20px',
                            fontSize: '2.5rem',
                            fill: rarityColor[disc.rarity],
                          },
                        }}
                      />
                    </Box>
                    <Box
                      style={{ height: 0, position: 'absolute', bottom: 20 }}
                    >
                      <Text
                        style={{
                          backgroundColor: 'var(--mantine-color-gray-7)',
                          padding: '0 20px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                        }}
                      >
                        {disc.level}
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <CardThemed
                  style={{
                    padding: '4px 8px',
                    width: '100%',
                  }}
                >
                  <Text
                    onMouseEnter={() => setStatHighlight(disc.mainStatKey)}
                    onMouseLeave={() => setStatHighlight('')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      justifyContent: 'center',
                      gap: 4,
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <StatIcon statKey={disc.mainStatKey}></StatIcon>
                    <Box
                      component="span"
                      style={{ position: 'relative', zIndex: 1 }}
                    >
                      {toPercent(
                        getDiscMainStatVal(
                          disc.rarity,
                          disc.mainStatKey,
                          disc.level
                        ),
                        disc.mainStatKey
                      ).toFixed(statKeyToFixed(disc.mainStatKey))}
                      {getUnitStr(disc.mainStatKey)}
                    </Box>
                    <Box
                      style={{
                        content: '""',
                        position: 'absolute',
                        padding: '4px 0',
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: getHighlightRGBA(isHL),
                        transition: 'background-color 0.3s ease-in-out',
                        pointerEvents: 'none',
                      }}
                    />
                  </Text>
                </CardThemed>
              </Box>
            </CardThemed>
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingLeft: '10px',
                flexGrow: 1,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              {disc.substats.map(
                (substat) =>
                  substat.key && (
                    <SubstatDisplay
                      key={substat.key}
                      substat={substat}
                      rarity={disc.rarity}
                    />
                  )
              )}
            </Box>
          </Box>
        </ConditionalWrapper>
      </Suspense>
    </ZCard>
  ) : (
    <EmptyCompactCard placeholder={`Disc Slot ${slotKey}`} onClick={onClick} />
  )
}

function SubstatDisplay({
  substat,
  rarity,
}: {
  substat: ISubstat
  rarity: DiscRarityKey
}) {
  const { key, upgrades } = substat
  const { statHighlight, setStatHighlight } = useContext(StatHighlightContext)
  if (!upgrades || !key) return null
  const isHL = isHighlight(statHighlight, key)
  const displayValue = toPercent(
    getDiscSubStatBaseVal(key, rarity) * upgrades,
    key
  ).toFixed(statKeyToFixed(key))
  return (
    <Text
      onMouseEnter={() => setStatHighlight(key)}
      onMouseLeave={() => setStatHighlight('')}
      style={{
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        gap: 4,
        position: 'relative',
      }}
    >
      <StatIcon statKey={key} />
      <Box component="span" style={{ position: 'relative', zIndex: 1 }}>
        {displayValue}
        {getUnitStr(key)}
        {upgrades > 1 && <ColorText color="yellow"> +{upgrades - 1}</ColorText>}
      </Box>
      <Box
        style={{
          content: '""',
          position: 'absolute',
          left: '-5%',
          width: '105%',
          height: '130%',
          borderRadius: 4,
          backgroundColor: getHighlightRGBA(isHL),
          transition: 'background-color 0.3s ease-in-out',
        }}
      />
    </Text>
  )
}
