import {
  ActionIcon,
  Box,
  Card,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconEdit } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { ColorText, ConditionalWrapper } from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type React from 'react'
import type { ReactNode } from 'react'
import { memo, Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { discDefIcon } from '../../assets'
import type { DiscRarityKey, LocationKey } from '../../consts'
import {
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  rarityColor,
} from '../../consts'
import { useDatabaseContext, useDisc } from '../../db-ui'
import type { IDisc, ISubstat } from '../../zood'
import { StatDisplay } from '../Character'
import { LocationAutocomplete } from '../Character/LocationAutocomplete'
import { LocationName } from '../Character/LocationName'
import { ZCard } from '../Components'
import classes from './DiscCard.module.css'
import { DiscSet2p, DiscSet4p, DiscSetName } from './DiscTrans'
import { useSpinner } from './util'

export const DiscCard = memo(function DiscCard({
  discId,
  onEdit,
}: {
  key: string
  discId: string
  onEdit?: (id: string) => void
}) {
  const { database } = useDatabaseContext()
  const disc = useDisc(discId)
  const onEditCB = useCallback(() => onEdit && onEdit(discId), [discId, onEdit])
  const onDelete = useCallback(() => {
    database.discs.remove(discId)
  }, [database.discs, discId])
  const setLocation = useCallback(
    (location: LocationKey) => database.discs.set(discId, { location }),
    [database.discs, discId]
  )
  const onLockToggle = useCallback(
    () => database.discs.set(discId, ({ lock }) => ({ lock: !lock })),
    [database.discs, discId]
  )
  if (!disc) return null
  return (
    <DiscCardObj
      disc={disc}
      onEdit={onEditCB}
      onDelete={onDelete}
      setLocation={setLocation}
      onLockToggle={onLockToggle}
    />
  )
})
export function DiscCardObj({
  disc,
  onClick,
  onEdit,
  setLocation,
  extraButtons,
}: {
  disc: IDisc
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onLockToggle?: () => void
  setLocation?: (lk: LocationKey) => void
  extraButtons?: React.JSX.Element
}) {
  const { t } = useTranslation('disc')
  const {
    rotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
  } = useSpinner()
  const { slotKey, setKey, rarity, level, mainStatKey, substats, location } =
    disc
  const [show, onShow] = useBoolState()

  const wrapperFunc = useCallback(
    (children: ReactNode) => (
      <Box
        onClick={onClick}
        style={{
          cursor: 'pointer',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    ),
    [onClick]
  )
  const falseWrapperFunc = useCallback(
    (children: ReactNode) => (
      <Box style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    ),
    []
  )

  return (
    <Suspense fallback={<Skeleton width="100%" height={350} />}>
      <ZCard
        bgt="dark"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <ConditionalWrapper
          condition={!!onClick}
          wrapper={wrapperFunc}
          falseWrapper={falseWrapperFunc}
        >
          <Card.Section>
            <Box className={classes.discArtSection}>
              <Box onClick={onShow} style={{ cursor: 'pointer' }}>
                <Tooltip
                  label={
                    <Box>
                      <Text>
                        2-Piece Set: <DiscSet2p setKey={setKey} />
                      </Text>
                      <Text>
                        4-Piece Set: <DiscSet4p setKey={setKey} />
                      </Text>
                    </Box>
                  }
                  opened={show}
                  withinPortal={false}
                >
                  <Text
                    style={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    [{slotKey}] <DiscSetName setKey={setKey} />
                  </Text>
                </Tooltip>
              </Box>
              <Box
                style={{
                  border: `4px solid ${rarityColor[rarity]}`,
                  borderRadius: '50%',
                }}
              >
                <Box
                  component="div"
                  onMouseDown={handleMouseDown as any}
                  onMouseMove={handleMouseMove as any}
                  onMouseUp={handleMouseUp as any}
                  onMouseLeave={handleMouseUp as any}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '50%',
                    border: `2px solid black`,
                  }}
                >
                  <Box
                    component="img"
                    alt="Disc Piece Image"
                    src={discDefIcon(setKey)}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      width: 'auto',
                      float: 'right',
                      height: '150px',
                      transition: isDragging
                        ? 'none'
                        : 'transform 0.1s ease-out',
                    }}
                  />
                  <Box style={{ height: 0, position: 'absolute', bottom: 30 }}>
                    <Text
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        padding: '3px 30px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                      }}
                    >
                      {level}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack gap={4} p="md">
              <Box
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    fontWeight: 'bold',
                  }}
                >
                  <StatDisplay statKey={mainStatKey} />
                </Text>
                <Text fw="bold">
                  {toPercent(
                    getDiscMainStatVal(rarity, mainStatKey, level),
                    mainStatKey
                  ).toFixed(statKeyToFixed(mainStatKey))}
                  {getUnitStr(mainStatKey)}
                </Text>
              </Box>
              {substats.map(
                (substat) =>
                  substat.key && (
                    <SubstatDisplay
                      key={substat.key}
                      substat={substat}
                      rarity={rarity}
                    />
                  )
              )}
            </Stack>
          </Card.Section>
        </ConditionalWrapper>

        <Box style={{ flexGrow: 1 }} />
        <Box
          style={{
            padding: 8,
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box style={{ flexGrow: 1 }}>
            {setLocation ? (
              <LocationAutocomplete locKey={location} setLocKey={setLocation} />
            ) : (
              <LocationName location={location} />
            )}
          </Box>
          <Box
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'stretch',
              height: '100%',
            }}
          >
            {!!onEdit && (
              <Tooltip label={t('edit')}>
                <ActionIcon color="blue" size="sm" onClick={onEdit}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {extraButtons}
          </Box>
        </Box>
      </ZCard>
    </Suspense>
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
  if (!upgrades || !key) return null
  const displayValue = toPercent(
    getDiscSubStatBaseVal(key, rarity) * upgrades,
    key
  ).toFixed(statKeyToFixed(key))
  return (
    <Text
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        gap: 4,
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <StatDisplay statKey={key} />
        {upgrades > 1 && <ColorText color="yellow">+{upgrades - 1}</ColorText>}
      </Box>
      <Box component="span">
        {displayValue}
        {getUnitStr(key)}
      </Box>
    </Text>
  )
}
