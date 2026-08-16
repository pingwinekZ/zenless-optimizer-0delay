import { Box, Text } from '@mantine/core'
import { useMemo } from 'react'
import { characterAsset, commonDefImages, discDefIcon } from '../../../assets'
import type { CharacterKey, DiscSlotKey } from '../../../consts'
import { allDiscSlotKeys, rarityColor } from '../../../consts'
import type { ICachedDisc } from '../../../db'
import { useDatabaseContext } from '../../../db-ui'

const commonStyles = Object.freeze({
  position: 'absolute' as const,
  borderRadius: '50%',
  width: '34px',
  height: '34px',
})
const stylesMap = {
  '1': {
    top: '5px',
    left: '29px',
    ...commonStyles,
  },
  '2': {
    top: '42px',
    left: '10px',
    ...commonStyles,
  },
  '3': {
    top: '81px',
    left: '29px',
    ...commonStyles,
  },
  '4': {
    top: '81px',
    left: '84px',
    ...commonStyles,
  },
  '5': {
    top: '42px',
    left: '103px',
    ...commonStyles,
  },
  '6': {
    top: '5px',
    left: '84px',
    ...commonStyles,
  },
}

type CommonStyles = typeof commonStyles
type SlotPosition = { top: string; left: string }
type DiscStyles = CommonStyles & SlotPosition

type DiscInfo = {
  key: DiscSlotKey
  styles: DiscStyles
  disc: ICachedDisc | undefined
}

export function CharacterCardEquipment({
  characterKey,
}: {
  characterKey: CharacterKey
}) {
  const { database } = useDatabaseContext()
  const characterDiscs = useMemo(
    () =>
      database.discs.values.filter((disc) => disc.location === characterKey),
    [database.discs.values, characterKey]
  )
  return (
    <Box
      style={{
        position: 'relative',
      }}
    >
      <Box
        component="img"
        src={characterAsset(characterKey, 'full')}
        style={{
          maxWidth: '100%',
          flexShrink: 1,
          position: 'absolute',
          zIndex: 0,
          left: '-83px',
          top: '15px',
        }}
      />

      <Discs discs={characterDiscs} />
    </Box>
  )
}
function Discs({ discs }: { discs: ICachedDisc[] }) {
  const mappedDiscs: DiscInfo[] = allDiscSlotKeys.map((slotKey) => ({
    key: slotKey,
    styles: stylesMap[slotKey] || {},
    disc: discs?.find((disc) => disc.slotKey === slotKey),
  }))
  return (
    <Box
      style={{
        position: 'absolute',
        width: '147px',
        height: '129px',
        top: '75px',
        right: '75px',
        background: `url(${commonDefImages('discDrive')})`,
        backgroundSize: '100% 100%',
        zIndex: 10,
        transform: 'scale(1.96)',
      }}
    >
      {mappedDiscs.map((discInfo: DiscInfo) =>
        discInfo.disc ? (
          <Box key={discInfo.key}>
            <Box
              style={{
                border: `2px solid ${
                  discInfo.disc?.rarity ? rarityColor[discInfo.disc.rarity] : ''
                }`,
                ...discInfo.styles,
              }}
            >
              <Box
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={discDefIcon(discInfo.disc?.setKey)}
                  width="30px"
                  height="30px"
                />
                <Box style={{ position: 'absolute', bottom: -3 }}>
                  <Text
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.85)',
                      padding: '3px 5px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      lineHeight: '6px',
                      fontSize: '8px',
                    }}
                    size="sm"
                  >
                    {discInfo.disc.level}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : null
      )}
    </Box>
  )
}
