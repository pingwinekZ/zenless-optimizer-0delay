import {
  Box,
  Button,
  Divider,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconArrowsHorizontal } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { Suspense, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { specialityDefIcon } from '../../assets'
import type {
  DiscSlotKey,
  PhaseKey,
  SpecialityKey,
  WengineKey,
} from '../../consts'
import { allSpecialityKeys } from '../../consts'
import type { ICachedDisc } from '../../db'
import {
  CharacterContext,
  useDatabaseContext,
  useDisc,
  useDiscs,
} from '../../db-ui'
import { getCharStat } from '../../stats'
import { ZCard } from '../Components'
import { DiscCardObj, DiscEditor, DiscSwapModal } from '../Disc'
import { WengineCardObj, WengineSwapModal } from '../Wengine'

export function EquippedGrid({
  setWengine,
  setDisc,
}: {
  setWengine: (key: WengineKey | '') => void
  setDisc: (slotKey: DiscSlotKey, id: string | null) => void
}) {
  const { database } = useDatabaseContext()
  const character = useContext(CharacterContext)
  const [discIdToEdit, setDiscIdToEdit] = useState<string | undefined>()

  // Wengine key and phase come directly from the character
  const wengineKey = character?.wengineKey
  const wenginePhase = character?.wenginePhase ?? 1

  const characterType = character
    ? getCharStat(character.key).specialty
    : allSpecialityKeys[0]
  const discs = useDiscs(character?.equippedDiscs)
  const disc = useDisc(discIdToEdit)

  return (
    <Box>
      <Stack>
        <Suspense fallback={false}>
          {disc && (
            <DiscEditor
              disc={disc}
              show={!!discIdToEdit}
              onShow={() => setDiscIdToEdit(discIdToEdit)}
              onClose={() => setDiscIdToEdit(undefined)}
              cancelEdit={() => setDiscIdToEdit(undefined)}
            />
          )}
        </Suspense>
        <Box>
          {wengineKey ? (
            <WengineCardObj
              wengine={{
                key: wengineKey,
                level: 60,
                modification: 5,
                phase: wenginePhase as PhaseKey,
              }}
              onEdit={() => setDiscIdToEdit(undefined)}
              extraButtons={
                <WengineSwapButton
                  wengineKey={wengineKey}
                  wengineTypeKey={characterType}
                  onChangeKey={(key) => setWengine(key)}
                />
              }
            />
          ) : (
            <WeaponSwapCard
              wengineTypeKey={characterType}
              onChangeKey={(key) => setWengine(key)}
            />
          )}
        </Box>
        <Box>
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 3, xl: 3 }}
            spacing="xs"
          >
            {!!discs &&
              Object.entries(discs).map(([slotKey, disc]) => (
                <Box key={disc?.id || slotKey}>
                  {disc?.id ? (
                    <DiscCardObj
                      disc={disc}
                      extraButtons={
                        <DiscSwapButtonButton
                          disc={disc}
                          slotKey={slotKey}
                          onChangeId={(id) => setDisc(slotKey, id)}
                        />
                      }
                      onEdit={() => setDiscIdToEdit(disc.id)}
                      onLockToggle={() =>
                        database.discs.set(disc.id, ({ lock }) => ({
                          lock: !lock,
                        }))
                      }
                    />
                  ) : (
                    <DiscSwapCard
                      slotKey={slotKey}
                      onChangeId={(id) => setDisc(slotKey, id)}
                    />
                  )}
                </Box>
              ))}
          </SimpleGrid>
        </Box>
      </Stack>
    </Box>
  )
}

export function WeaponSwapCard({
  wengineTypeKey,
  onChangeKey,
}: {
  wengineTypeKey: SpecialityKey
  onChangeKey: (key: WengineKey | '') => void
}) {
  const [show, onOpen, onClose] = useBoolState()
  return (
    <ZCard
      bgt="light"
      style={{
        height: '100%',
        width: '100%',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box p="md">
        <Text>
          <ImgIcon src={specialityDefIcon(wengineTypeKey)} />{' '}
        </Text>
      </Box>
      <Divider />
      <Box
        style={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <WengineSwapModal
          wengineKey=""
          wengineTypeKey={wengineTypeKey}
          show={show}
          onClose={onClose}
          onChangeKey={onChangeKey}
        />
        <Button onClick={onOpen} color="cyan" style={{ borderRadius: '1em' }}>
          <IconArrowsHorizontal style={{ height: 100, width: 100 }} />
        </Button>
      </Box>
    </ZCard>
  )
}

export function DiscSwapCard({
  slotKey,
  onChangeId,
}: {
  slotKey: DiscSlotKey
  onChangeId: (id: string | null) => void
}) {
  const [show, onOpen, onClose] = useBoolState()
  const { t } = useTranslation('disc')
  return (
    <ZCard
      bgt="light"
      style={{
        height: '100%',
        width: '100%',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box p="md">
        <Text>{t(`slotName`, { slotKey: slotKey })}</Text>
      </Box>
      <Divider />
      <Box
        style={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <DiscSwapModal
          disc={undefined}
          slotKey={slotKey}
          show={show}
          onClose={onClose}
          onChangeId={onChangeId}
        />
        <Button onClick={onOpen} color="cyan" style={{ borderRadius: '1em' }}>
          <IconArrowsHorizontal style={{ height: 100, width: 100 }} />
        </Button>
      </Box>
    </ZCard>
  )
}
function DiscSwapButtonButton({
  disc,
  slotKey,
  onChangeId,
}: {
  disc: ICachedDisc
  slotKey: DiscSlotKey
  onChangeId: (id: string | null) => void
}) {
  const { t } = useTranslation('page_characters')
  const [show, onOpen, onClose] = useBoolState()
  return (
    <>
      <Tooltip label={t('tabEquip.swapDisc')}>
        <Button
          color="cyan"
          size="compact-sm"
          onClick={onOpen}
          aria-label={t('tabEquip.swapDisc')}
        >
          <IconArrowsHorizontal />
        </Button>
      </Tooltip>
      <DiscSwapModal
        disc={disc}
        slotKey={slotKey}
        show={show}
        onClose={onClose}
        onChangeId={onChangeId}
      />
    </>
  )
}

function WengineSwapButton({
  wengineKey,
  wengineTypeKey,
  onChangeKey,
}: {
  wengineKey: WengineKey | ''
  wengineTypeKey: SpecialityKey
  onChangeKey: (key: WengineKey | '') => void
}) {
  const { t } = useTranslation('page_characters')

  const [show, onOpen, onClose] = useBoolState()
  return (
    <>
      <Tooltip label={t('tabEquip.swapWengine')}>
        <Button color="cyan" size="compact-sm" onClick={onOpen}>
          <IconArrowsHorizontal />
        </Button>
      </Tooltip>
      <WengineSwapModal
        wengineKey={wengineKey}
        wengineTypeKey={wengineTypeKey}
        onChangeKey={onChangeKey}
        show={show}
        onClose={onClose}
      />
    </>
  )
}
