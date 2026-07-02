import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Flex,
  Group,
  Image,
  LoadingOverlay,
  Progress,
  Skeleton,
  Text,
  TextInput,
  useMatches,
} from '@mantine/core'
import {
  IconCamera,
  IconChevronRight,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react'

import { CardThemed, ModalWrapper, usePrev } from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  range,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type { ChangeEvent } from 'react'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscSetKey, DiscSlotKey } from '../../../consts'
import {
  allDiscSlotKeys,
  discMaxLevel,
  getDiscMainStatVal,
} from '../../../consts'
import { type ICachedDisc, validateDiscBasedOnRarity } from '../../../db'
import { useDatabaseContext } from '../../../db-ui'
import type { Processed } from '../../../disc-scanner'
import { ScanningQueue } from '../../../disc-scanner'
import type { IDisc, ISubstat } from '../../../zood'
import { LocationAutocomplete } from '../../Character/LocationAutocomplete'
import { DiscCardObj } from '../DiscCard'
import { DiscMainStatGroup } from '../DiscMainStatGroup'
import { DiscRarityDropdown } from '../DiscRarityDropdown'
import { DiscSetAutocomplete } from '../DiscSetAutocomplete'
import { ScanInfoModal } from './ScanInfoModal'
import { textsFromImage } from './ScanningUtil'
import SubstatInput from './SubstatInput'

interface DiscReducerState {
  disc: Partial<ICachedDisc>
  validatedDisc?: IDisc
  errors?: string[]
}
function handleSubstats(
  index: number,
  substat: ISubstat | undefined,
  disc: Partial<ICachedDisc>
): ISubstat[] {
  const substats = [...(disc.substats || [])]
  if (substat) {
    const oldIndex = substat?.key
      ? substats.findIndex((current) => current.key === substat.key)
      : -1
    if (oldIndex === -1 || oldIndex === index) substats[index] = substat
    else
      [substats[index], substats[oldIndex]] = [
        substats[oldIndex],
        substats[index],
      ]

    if (oldIndex !== -1 && substats[oldIndex] === undefined) {
      substats.splice(oldIndex, 1)
    }
  } else {
    substats.splice(index, 1)
  }

  return substats
}
function reducer(
  state: DiscReducerState,
  action: Partial<ICachedDisc>
): DiscReducerState {
  if (!action || Object.keys(action).length === 0)
    return {
      disc: {} as Partial<ICachedDisc>,
    }
  const disc = { ...state.disc, ...action }
  const { validatedDisc, errors } = validateDiscBasedOnRarity(disc)

  return {
    disc: { ...disc, ...(validatedDisc || {}) } as Partial<ICachedDisc>,
    validatedDisc,
    errors,
  }
}
function useDiscValidation(discFromProp: Partial<ICachedDisc>) {
  const [{ disc, validatedDisc, errors }, setDisc] = useReducer(reducer, {
    disc: discFromProp,
    validatedDisc: undefined,
    errors: [],
  })
  if (usePrev(discFromProp) !== discFromProp) setDisc(discFromProp)

  return { disc, validatedDisc, errors, setDisc }
}
export function DiscEditor({
  disc: discFromProp,
  show,
  allowUpload,
  onShow,
  onClose,
  fixedSlotKey,
  allowEmpty = false,
  disableSet = false,
  cancelEdit,
}: {
  disc: Partial<ICachedDisc>
  show: boolean
  allowUpload?: boolean
  onShow: () => void
  onClose: () => void
  allowEmpty?: boolean
  disableSet?: boolean
  fixedSlotKey?: DiscSlotKey
  cancelEdit?: () => void
}) {
  const { t } = useTranslation('disc')
  const { database } = useDatabaseContext()
  const { disc, validatedDisc, setDisc, errors } =
    useDiscValidation(discFromProp)
  const {
    prev,
    prevEditType,
  }: {
    prev: ICachedDisc | undefined
    prevEditType: 'edit' | 'duplicate' | 'upgrade' | ''
  } = useMemo(() => {
    if (!disc) return { prev: undefined, prevEditType: '' }
    const dbDisc = disc?.id && database.discs.get(disc?.id)
    if (dbDisc) return { prev: dbDisc, prevEditType: 'edit' }
    if (disc === undefined) return { prev: undefined, prevEditType: '' }
    const { duplicated, upgraded } = database.discs.findDups(
      disc as ICachedDisc
    )
    return {
      prev: duplicated[0] ?? upgraded[0],
      prevEditType: duplicated.length !== 0 ? 'duplicate' : 'upgrade',
    }
  }, [disc, database])

  const { rarity = 'S', level = 0 } = disc ?? {}
  const slotKey = useMemo(() => {
    return fixedSlotKey ?? disc?.slotKey
  }, [fixedSlotKey, disc])

  const reset = useCallback(() => {
    cancelEdit?.()
    setDisc({})
    setScannedData(undefined)
  }, [cancelEdit, setDisc])

  const setSubstat = useCallback(
    (index: number, substat?: ISubstat) => {
      const substats = handleSubstats(index, substat, disc)

      setDisc({ substats })
    },
    [disc, setDisc]
  )
  const onCloseModal = useCallback(() => {
    if (
      (disc.id || Object.keys(disc).length > 0) &&
      !window.confirm(t('editor.clearPrompt') as string)
    ) {
      return
    }
    onClose()
    reset()
  }, [t, disc, onClose, reset])
  const isValid = !errors?.length
  const grmd = useMatches({ md: true, base: false })
  const removeId = disc?.id || prev?.id
  const canClearDisc = (): boolean =>
    window.confirm(t('editor.clearPrompt') as string)

  // Scanning stuff
  const queueRef = useRef(new ScanningQueue(textsFromImage, false))
  const queue = queueRef.current
  const [{ processedNum, outstandingNum, scanningNum }, setScanningData] =
    useState({ processedNum: 0, outstandingNum: 0, scanningNum: 0 })

  const [scannedData, setScannedData] = useState(
    undefined as undefined | Omit<Processed, 'disc'>
  )

  const { fileName, imageURL, texts } = scannedData ?? {}
  const queueTotal = processedNum + outstandingNum + scanningNum

  const uploadFiles = useCallback(
    (files?: FileList | null) => {
      if (!files) return
      onShow()
      queue.addFiles(Array.from(files).map((f) => ({ f, fName: f.name })))
    },
    [onShow, queue]
  )
  const clearQueue = useCallback(() => {
    queue.clearQueue()
  }, [queue])

  const onUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target) return
      uploadFiles(e.target.files)
      e.target.value = ''
    },
    [uploadFiles]
  )

  useEffect(() => {
    if (!processedNum || scannedData) return
    const processed = queue.shiftProcessed()
    if (!processed) return
    const { disc: scannedDisc, ...rest } = processed
    setScannedData(rest)
    setDisc((scannedDisc ?? {}) as Partial<ICachedDisc>)
  }, [queue, processedNum, scannedData, setDisc])

  useEffect(() => {
    const pasteFunc = (e: Event) => {
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return
      }

      uploadFiles((e as ClipboardEvent).clipboardData?.files)
    }

    allowUpload && window.addEventListener('paste', pasteFunc)
    return () => {
      if (allowUpload) window.removeEventListener('paste', pasteFunc)
    }
  }, [uploadFiles, allowUpload])

  useEffect(() => {
    queue.callback = setScanningData
    return () => {
      queue.callback = () => {}
    }
  }, [queue])

  return (
    <Suspense fallback={false}>
      <ModalWrapper opened={show} onClose={onCloseModal}>
        <CardThemed bgt="dark">
          <Card.Section
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
            }}
          >
            <Text fw={700}>Disc Editor</Text>
            <ActionIcon onClick={onCloseModal} variant="subtle">
              <IconX />
            </ActionIcon>
          </Card.Section>
          <Card.Section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 16,
            }}
          >
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 8,
              }}
            >
              {/* left column */}
              <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* set */}
                <Box style={{ display: 'flex', gap: 8 }}>
                  <DiscSetAutocomplete
                    disabled={disableSet || !!disc.id}
                    size="sm"
                    discSetKey={disc?.setKey ?? ''}
                    setDiscSetKey={(key) =>
                      setDisc({ setKey: key as DiscSetKey })
                    }
                    style={{ flexGrow: 1 }}
                    label={disc?.setKey ? '' : t('editor.unknownSetName')}
                  />
                  <DiscRarityDropdown
                    rarity={disc ? rarity : undefined}
                    onRarityChange={(rarity) => setDisc({ rarity })}
                    disabled={!disc.mainStatKey || !!disc.id}
                  />
                </Box>
                {/* level */}
                <Box component="div" style={{ display: 'flex' }}>
                  <TextInput
                    label="Level"
                    style={{ flexShrink: 1, flexGrow: 1, marginRight: 8 }}
                    value={level}
                    disabled={!disc.rarity}
                    onChange={(e) => {
                      const value = parseInt(e.currentTarget.value) || 0
                      setDisc({ level: value })
                    }}
                  />
                  <Button.Group>
                    <Button
                      onClick={() => setDisc({ level: level - 1 })}
                      disabled={!disc.rarity || level === 0}
                      variant="default"
                    >
                      -
                    </Button>
                    {rarity
                      ? range(0, discMaxLevel[rarity] / 3)
                          .map((i) => 3 * i)
                          .map((i) => (
                            <Button
                              key={i}
                              onClick={() => setDisc({ level: i })}
                              disabled={!disc.rarity || level === i}
                              variant="default"
                            >
                              {i}
                            </Button>
                          ))
                      : null}
                    <Button
                      onClick={() => setDisc({ level: level + 1 })}
                      disabled={!disc.rarity || level === discMaxLevel[rarity]}
                      variant="default"
                    >
                      +
                    </Button>
                  </Button.Group>
                </Box>
                {/* slot */}
                <Group gap={8}>
                  <CardThemed bgt="light" style={{ padding: '8px 16px' }}>
                    <Text c="dimmed">Slot [{slotKey}]</Text>
                  </CardThemed>
                  <Button.Group style={{ flexGrow: 1 }}>
                    {allDiscSlotKeys.map((sk) => (
                      <Button
                        key={sk}
                        color={sk === slotKey ? 'green' : undefined}
                        onClick={() => setDisc({ slotKey: sk })}
                        disabled={
                          !!disc.id || !!fixedSlotKey || !disc.mainStatKey
                        }
                        style={{ flexGrow: 1 }}
                        variant={sk === slotKey ? 'filled' : 'default'}
                      >
                        {sk}
                      </Button>
                    ))}
                  </Button.Group>
                  <Button
                    onClick={() => setDisc({ lock: !disc?.lock })}
                    color={disc?.lock ? 'green' : 'gray'}
                    disabled={!disc || !disc.mainStatKey}
                    variant={disc?.lock ? 'filled' : 'default'}
                  >
                    {disc?.lock ? (
                      <IconLock size={18} />
                    ) : (
                      <IconLockOpen size={18} />
                    )}
                  </Button>
                </Group>
                {/* main stat */}
                <Box component="div" style={{ display: 'flex', gap: 8 }}>
                  <DiscMainStatGroup
                    slotKey={slotKey}
                    statKey={disc?.mainStatKey}
                    setStatKey={(mainStatKey) => setDisc({ mainStatKey })}
                  />
                  <CardThemed bgt="light" style={{ padding: 8, flexGrow: 1 }}>
                    <Text c="dimmed">
                      {disc?.mainStatKey
                        ? `${toPercent(
                            getDiscMainStatVal(rarity, disc.mainStatKey, level),
                            disc.mainStatKey
                          ).toFixed(
                            statKeyToFixed(disc.mainStatKey)
                          )}${getUnitStr(disc.mainStatKey)}`
                        : t('mainStat')}
                    </Text>
                  </CardThemed>
                </Box>
                <LocationAutocomplete
                  locKey={disc?.location ?? ''}
                  setLocKey={(charKey) => setDisc({ location: charKey })}
                />
                {/* Image OCR */}
                {allowUpload && (
                  <CardThemed bgt="light">
                    <Card.Section
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 16,
                      }}
                    >
                      <Suspense
                        fallback={<Skeleton width="100%" height={100} />}
                      >
                        <Group gap={8} align="center">
                          <Box style={{ flexGrow: 1 }}>
                            <label htmlFor="contained-button-file">
                              <input
                                accept="image/*"
                                id="contained-button-file"
                                multiple
                                type="file"
                                onChange={onUpload}
                                style={{ display: 'none' }}
                              />
                              <Button
                                component="span"
                                leftSection={<IconCamera size={16} />}
                                variant="default"
                              >
                                {t('editor.uploadBtn')}
                              </Button>
                            </label>
                          </Box>

                          <Box>
                            <ScanInfoModal />
                          </Box>
                        </Group>

                        {imageURL && (
                          <Box
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            <Image
                              src={imageURL}
                              w="100%"
                              maw={350}
                              h="auto"
                              alt={
                                fileName ||
                                'Screenshot to parse for artifact values'
                              }
                            />
                          </Box>
                        )}
                        {!!queueTotal && (
                          <Progress value={(100 * processedNum) / queueTotal} />
                        )}
                        {!!queueTotal && (
                          <CardThemed style={{ paddingLeft: 16 }}>
                            <Flex align="center">
                              {!!scanningNum && <LoadingOverlay visible />}
                              <Text style={{ flexGrow: 1, marginLeft: 8 }}>
                                <Box component="span">
                                  Screenshots in file-queue:
                                  <b>{queueTotal}</b>
                                </Box>
                              </Text>

                              <Button
                                size="sm"
                                color="red"
                                onClick={clearQueue}
                                variant="default"
                              >
                                Clear file-queue
                              </Button>
                            </Flex>
                          </CardThemed>
                        )}
                      </Suspense>
                    </Card.Section>
                  </CardThemed>
                )}
              </Box>

              {/* right column */}
              <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1, 2, 3].map((index) => (
                  <SubstatInput
                    rarity={rarity}
                    key={index}
                    index={index}
                    disc={disc}
                    setSubstat={setSubstat}
                  />
                ))}
                {!!texts?.length && (
                  <CardThemed bgt="light">
                    <Card.Section style={{ padding: 16 }}>
                      {texts.map((text, i) => (
                        <Text key={i} c="orange">
                          {text}
                        </Text>
                      ))}
                    </Card.Section>
                  </CardThemed>
                )}
              </Box>
            </Box>

            {/* Duplicate/Updated/Edit UI */}
            {prev && (
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: grmd ? '5.5fr 1fr 5.5fr' : '1fr',
                  gap: 8,
                  justifyContent: 'space-around',
                }}
              >
                <Box
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <CardThemed bgt="light">
                    <Text ta="center" py={8} fw={700} c="dimmed">
                      {prevEditType !== 'edit'
                        ? prevEditType === 'duplicate'
                          ? t('editor.dupeDisc')
                          : t('editor.updateDisc')
                        : t('editor.beforeEdit')}
                    </Text>
                  </CardThemed>
                  <DiscCardObj disc={prev} />
                </Box>
                {grmd && (
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CardThemed bgt="light" style={{ display: 'flex' }}>
                      <IconChevronRight size={40} />
                    </CardThemed>
                  </Box>
                )}
                <Box
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <CardThemed bgt="light">
                    <Text ta="center" py={8} fw={700} c="dimmed">
                      {t('editor.preview')}
                    </Text>
                  </CardThemed>
                  {validatedDisc && <DiscCardObj disc={validatedDisc} />}
                </Box>
              </Box>
            )}
            {/* Error alert */}
            {!isValid && (
              <Alert variant="filled" color="red">
                {errors?.map((e, i) => (
                  <Box key={i}>{e}</Box>
                ))}
              </Alert>
            )}
            {/* Buttons */}
            <Group gap={16}>
              {prevEditType === 'edit' && prev?.id ? (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    disc && database.discs.set(prev.id, disc)
                    reset()
                  }}
                  disabled={!validatedDisc || !isValid}
                  color="blue"
                >
                  {t('editor.btnSave')}
                </Button>
              ) : (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    if (!validatedDisc) return
                    database.discs.new(validatedDisc)
                    reset()
                  }}
                  disabled={!validatedDisc || !isValid}
                  color={prevEditType === 'duplicate' ? 'yellow' : 'blue'}
                >
                  {t('editor.btnAdd')}
                </Button>
              )}
              {allowEmpty && (
                <Button
                  leftSection={<IconRefresh size={16} />}
                  disabled={!disc}
                  onClick={() => {
                    canClearDisc() && reset()
                  }}
                  color="red"
                  variant="default"
                >
                  {t('editor.btnClear')}
                </Button>
              )}
              {prev && prevEditType !== 'edit' && (
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    if (!validatedDisc) return
                    database.discs.set(prev.id, validatedDisc)
                    reset()
                  }}
                  disabled={!isValid}
                  color="green"
                >
                  {t('editor.btnUpdate')}
                </Button>
              )}
              {!!removeId && (
                <Button
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    if (!window.confirm(t('editor.confirmDelete'))) return
                    database.discs.remove(removeId)
                    reset()
                  }}
                  disabled={!removeId}
                  color="red"
                  variant="default"
                >
                  {t('editor.delete')}
                </Button>
              )}
            </Group>
          </Card.Section>
        </CardThemed>
      </ModalWrapper>
    </Suspense>
  )
}
