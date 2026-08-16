import {
  ActionIcon,
  Box,
  Divider,
  SimpleGrid,
  Skeleton,
  Text,
  TextInput,
} from '@mantine/core'
import { IconCircleMinus, IconX } from '@tabler/icons-react'
import { useMediaQueryUp } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  ImgIcon,
  ModalWrapper,
  useInfScroll,
} from '@zenless-optimizer/common/ui'
import type { ChangeEvent } from 'react'
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { specialityDefIcon } from '../../assets'
import type { SpecialityKey, WengineKey } from '../../consts'
import { allWengineKeys } from '../../consts'
import { getWengineStat } from '../../stats'
import { WengineCard } from './WengineCard'

const numToShowMap = { xs: 2 * 3, sm: 2 * 3, md: 3 * 3, lg: 4 * 3, xl: 4 * 3 }

export function WengineSwapModal({
  wengineKey,
  onChangeKey,
  wengineTypeKey,
  show,
  onClose,
}: {
  wengineKey: WengineKey | ''
  onChangeKey: (key: WengineKey | '') => void
  wengineTypeKey: SpecialityKey
  show: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(['page_characters', 'page_wengine'])
  const brPt = useMediaQueryUp()

  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const filteredKeys = useMemo(() => {
    let keys = allWengineKeys.filter((k) => {
      const stat = getWengineStat(k)
      return stat.type === wengineTypeKey
    })
    if (deferredSearchTerm) {
      const term = deferredSearchTerm.toLowerCase()
      keys = keys.filter((k) => k.toLowerCase().includes(term))
    }
    return keys
  }, [wengineTypeKey, deferredSearchTerm])

  const { numShow, setTriggerElement } = useInfScroll(
    numToShowMap[brPt],
    filteredKeys.length
  )
  const keysToShow = useMemo(
    () => filteredKeys.slice(0, numShow),
    [filteredKeys, numShow]
  )

  const selectKey = useCallback(
    (key: WengineKey | '') => {
      onChangeKey(key)
      onClose()
    },
    [onChangeKey, onClose]
  )

  return (
    <ModalWrapper opened={show} onClose={onClose}>
      <CardThemed>
        <Box p="sm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text fw={700} style={{ display: 'flex', gap: 8 }}>
            {wengineTypeKey ? (
              <ImgIcon src={specialityDefIcon(wengineTypeKey)} />
            ) : null}
            <span>{t('page_characters:tabEquip.swapWengine')}</span>
          </Text>
          <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
            <IconX />
          </ActionIcon>
        </Box>
        <Divider />
        <Box
          p="sm"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <TextInput
            autoFocus
            size="sm"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            label={t('page_wengine:wengineName')}
          />
          <Box mt={8}>
            <Suspense fallback={<Skeleton width="100%" height={1000} />}>
              <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing={8}>
                <CardThemed
                  bgt="light"
                  style={{
                    width: '100%',
                    height: '100%',
                    outline: wengineKey
                      ? 'none'
                      : '4px solid var(--mantine-color-yellow-filled)',
                  }}
                >
                  <Box
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => selectKey('')}
                  >
                    <Box
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <IconCircleMinus size={160} />
                      <Text>{t('wengine:button.unequipWengine')}</Text>
                    </Box>
                  </Box>
                </CardThemed>
                {keysToShow.map((key) => (
                  <Box
                    key={key}
                    style={
                      wengineKey === key
                        ? {
                            outline:
                              '4px solid var(--mantine-color-yellow-filled)',
                          }
                        : undefined
                    }
                  >
                    <WengineCard
                      key={key}
                      wengineId={key}
                      onClick={
                        wengineKey === key ? undefined : () => selectKey(key)
                      }
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Suspense>
          </Box>
          {filteredKeys.length !== keysToShow.length && (
            <Skeleton
              ref={(node) => {
                if (!node) return
                setTriggerElement(node)
              }}
              width="100%"
              height={100}
              mt={8}
            />
          )}
        </Box>
      </CardThemed>
    </ModalWrapper>
  )
}
