import { ActionIcon, Alert, Box, Flex, Stack, Text } from '@mantine/core'
import { IconCopy, IconX } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { ModalWrapper } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ICachedDisc } from '../db'
import { useDatabaseContext } from '../db-ui'
import { DiscCardObj } from '../ui'
import classes from './DupModal.module.css'

export default function DupModal({
  setDiscToEdit,
  show,
  onHide,
}: {
  setDiscToEdit: (id: string) => void
  show: boolean
  onHide: () => void
}) {
  const { t } = useTranslation('disc')
  return (
    <ModalWrapper opened={show} onClose={onHide}>
      <Box className={classes.card}>
        <Flex className={classes.cardHeader}>
          <Flex align="center" gap={8}>
            <IconCopy size={18} />
            <Text fw={700}>{t('showDupes')}</Text>
          </Flex>
          <ActionIcon onClick={onHide} size="sm">
            <IconX />
          </ActionIcon>
        </Flex>
        <Box className={classes.cardBody}>
          <DupContent setDiscToEdit={setDiscToEdit} />
        </Box>
      </Box>
    </ModalWrapper>
  )
}

function DupContent({
  setDiscToEdit,
}: {
  setDiscToEdit: (id: string) => void
}) {
  const { t } = useTranslation('disc')
  const { database } = useDatabaseContext()
  const discValuesDirty = useDataManagerValues(database.discs)
  const dupList = useMemo(() => {
    const dups = [] as ICachedDisc[][]
    const discKeys = discValuesDirty && [...database.discs.keys]

    while (discKeys.length !== 0) {
      const discKey = discKeys.shift()
      if (!discKey) continue
      const disc = database.discs.get(discKey)
      if (!disc) continue
      const { duplicated } = database.discs.findDups(disc, discKeys)
      if (!duplicated.length) continue
      const dupKeys = duplicated

      dups.push(
        [disc, ...dupKeys].sort((a) =>
          (database.discs.get(a.location)?.location ?? '') ? -1 : 1
        )
      )
    }
    return dups
  }, [database.discs, discValuesDirty])
  return (
    <Stack gap={2}>
      {dupList.map((dups) => (
        <Box key={dups.join()} className={classes.dupGroup}>
          <Flex gap={1} style={{ overflowX: 'auto' }}>
            {dups.map((dupDisc) => (
              <Box key={dupDisc.id} style={{ minWidth: 300 }}>
                <DiscCardObj
                  disc={dupDisc}
                  setLocation={(location) =>
                    database.discs.set(dupDisc.id, { location })
                  }
                  onLockToggle={() =>
                    database.discs.set(dupDisc.id, ({ lock }) => ({
                      lock: !lock,
                    }))
                  }
                  onDelete={() => database.discs.remove(dupDisc.id)}
                  onEdit={() => setDiscToEdit(dupDisc.id)}
                />
              </Box>
            ))}
          </Flex>
        </Box>
      ))}
      {!dupList.length && (
        <Alert variant="light" color="green">
          {t('noDupAlert')}
        </Alert>
      )}
    </Stack>
  )
}
