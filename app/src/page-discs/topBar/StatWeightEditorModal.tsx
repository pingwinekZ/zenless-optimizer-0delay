import {
  Button,
  CheckIcon,
  Divider,
  Flex,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Text,
} from '@mantine/core'
import { type UseFormReturnType, useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { characterAsset } from '../../assets'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  allCharacterKeys,
  allDiscSubStatKeys,
  discSlotToMainStatKeys,
} from '../../consts'
import type { StatWeightOverride } from '../../db'
import { useDatabaseContext } from '../../db-ui'
import { StatIcon } from '../../svgicons'
import { CharIconCircle } from '../../ui'
import {
  getCharacterEffectiveMainStats,
  getCharacterSubstatWeights,
} from '../../util'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'
import classes from './StatWeightEditorModal.module.css'

/** Disc slots 4/5/6 are the only ones with selectable main stats. */
const SCORING_SLOTS: DiscSlotKey[] = ['4', '5', '6']

const panelWidth = 220

/**
 * Substat weights are relative: 1.5 means "this roll is worth 1.5 rolls".
 * Anything above 0 is valid, and an empty field disables the substat entirely.
 */
const maxStatWeight = 3

type ScoringAlgorithmForm = {
  characterId: CharacterKey | null
  substatWeights: Partial<Record<DiscSubStatKey, number | ''>>
  mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}

function VerticalDivider() {
  return (
    <Flex direction="column">
      <Divider orientation="vertical" style={{ flexGrow: 1, margin: '10px' }} />
    </Flex>
  )
}

const statRenderOption: React.ComponentProps<
  typeof MultiSelect
>['renderOption'] = ({ option, checked }) => (
  <Flex align="center" gap={10} justify="space-between" w="100%">
    <Flex align="center" gap={10}>
      <StatIcon
        statKey={String(option.value)}
        iconProps={{ className: classes.optionIcon }}
      />
      {option.label}
    </Flex>
    {checked && <CheckIcon size={12} />}
  </Flex>
)

/**
 * Merges the character's default plan with any stored override so the modal
 * shows real numbers instead of placeholders. An override entry of `null`
 * (or a cleared field) means the substat is not scored, which displays as ''.
 */
function getScoringValuesForDisplay(
  characterId: CharacterKey,
  override: StatWeightOverride
): ScoringAlgorithmForm {
  const defaultWeights = getCharacterSubstatWeights(characterId)
  const defaultMainStats = getCharacterEffectiveMainStats(characterId)

  const substatWeights: Partial<Record<DiscSubStatKey, number | ''>> = {}
  for (const stat of allDiscSubStatKeys) {
    const value = override.substatWeights[stat]
    if (value === null) substatWeights[stat] = ''
    else if (typeof value === 'number') substatWeights[stat] = value
    else substatWeights[stat] = defaultWeights[stat] ?? ''
  }

  const mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>> = {}
  for (const slot of SCORING_SLOTS) {
    const overrideMainStats = override.mainStats[slot] as
      | DiscMainStatKey[]
      | undefined
    mainStats[slot] = overrideMainStats ?? defaultMainStats[slot] ?? []
  }

  return { characterId, substatWeights, mainStats }
}

/** Turns the form values back into a stored override (`null` = not scored). */
function getOverrideFromForm(values: ScoringAlgorithmForm): StatWeightOverride {
  const substatWeights: Record<string, number | null> = {}
  for (const stat of allDiscSubStatKeys) {
    const value = values.substatWeights[stat]
    const weight = typeof value === 'number' ? value : Number(value)
    substatWeights[stat] = Number.isFinite(weight) && weight > 0 ? weight : null
  }

  const mainStats: Record<string, string[]> = {}
  for (const slot of SCORING_SLOTS)
    mainStats[slot] = values.mainStats[slot] ?? []

  return { substatWeights, mainStats }
}

function StatValueRow({
  stat,
  label,
  form,
}: {
  stat: DiscSubStatKey
  label: string
  form: UseFormReturnType<ScoringAlgorithmForm>
}) {
  return (
    <Flex style={{ width: panelWidth }} align="center" gap={5}>
      <NumberInput
        size="xs"
        w={62}
        hideControls
        min={0}
        max={maxStatWeight}
        decimalScale={2}
        step={0.05}
        {...form.getInputProps(`substatWeights.${stat}`)}
      />
      <Flex align="center">
        <StatIcon statKey={stat} iconProps={{ className: classes.statIcon }} />
        <div className={classes.statText}>{label}</div>
      </Flex>
    </Flex>
  )
}

function MainStatsColumn({
  form,
  statLabel,
}: {
  form: UseFormReturnType<ScoringAlgorithmForm>
  statLabel: (statKey: string) => string
}) {
  const { t } = useTranslation('discTab')

  return (
    <Flex direction="column" style={{ flex: 1 }}>
      <Flex direction="column" gap={10} style={{ width: '100%' }}>
        {SCORING_SLOTS.map((slot) => (
          <Flex key={slot} direction="column" gap={1}>
            <div className={classes.partLabel}>
              {t('Scoring.SlotLabel', { slot })}
            </div>
            <MultiSelect
              className={classes.partMultiSelect}
              size="xs"
              clearable
              searchable
              style={{ width: '100%' }}
              placeholder={t('Scoring.SlotLabel', { slot })}
              renderOption={statRenderOption}
              comboboxProps={{ keepMounted: false }}
              data={discSlotToMainStatKeys[slot].map((key) => ({
                value: key,
                label: statLabel(key),
              }))}
              {...form.getInputProps(`mainStats.${slot}`)}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export function StatWeightEditorModal({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1000}
      centered
      closeOnClickOutside={false}
    >
      {opened && <StatWeightEditorModalContent close={onClose} />}
    </Modal>
  )
}

function StatWeightEditorModalContent({ close }: { close: () => void }) {
  const { database } = useDatabaseContext()
  const focusCharacter = useDiscTabStore((s) => s.focusCharacter)
  const { t } = useTranslation('discTab')
  const { t: tc } = useTranslation('charNames_gen')
  const { t: tk } = useTranslation('statKey_gen')

  // The modal only mounts while open, so the focus character is read once.
  const initialCharacter = focusCharacter ?? allCharacterKeys[0]

  const scoringAlgorithmForm = useForm<ScoringAlgorithmForm>({
    initialValues: getScoringValuesForDisplay(
      initialCharacter,
      database.statWeights.get(initialCharacter)
    ),
  })

  const focusCharacterId = scoringAlgorithmForm.getValues().characterId

  const statLabel = useCallback(
    (statKey: string) => (tk(statKey) || statKey) + getUnitStr(statKey),
    [tk]
  )

  const characterOptions = useMemo(
    () =>
      allCharacterKeys.map((ck) => ({
        value: ck,
        label: tc(ck, { defaultValue: ck }),
      })),
    [tc]
  )

  function loadCharacter(characterId: CharacterKey) {
    scoringAlgorithmForm.setValues(
      getScoringValuesForDisplay(
        characterId,
        database.statWeights.get(characterId)
      )
    )
  }

  function onModalOk() {
    if (!focusCharacterId) return
    database.statWeights.set(
      focusCharacterId,
      getOverrideFromForm(scoringAlgorithmForm.getValues())
    )
    close()
  }

  function handleResetDefault() {
    if (!focusCharacterId) return
    database.statWeights.resetCharacter(focusCharacterId)
    loadCharacter(focusCharacterId)
  }

  function handleResetAll() {
    const characterId = focusCharacterId
    modals.openConfirmModal({
      title: t('Scoring.ResetAllConfirm.Title'),
      children: t('Scoring.ResetAllConfirm.Description'),
      labels: {
        confirm: t('Scoring.Footer.ResetAll'),
        cancel: t('Scoring.Footer.Cancel'),
      },
      confirmProps: { color: 'red' },
      centered: true,
      onConfirm: () => {
        database.statWeights.resetAll()
        if (characterId) loadCharacter(characterId)
      },
    })
  }

  const previewSrc = focusCharacterId
    ? characterAsset(focusCharacterId, 'circle')
    : ''

  return (
    <>
      <div>
        <Divider
          my={10}
          label={t('Scoring.StatWeightsHeader')}
          labelPosition="center"
        />

        <Flex gap={20}>
          <Flex direction="column" gap={5}>
            <Select
              placeholder={t('RelicFilterBar.SelectCharacter')}
              data={characterOptions}
              value={focusCharacterId}
              onChange={(value) =>
                value && loadCharacter(value as CharacterKey)
              }
              searchable
              clearable={false}
              // The modal focuses the first input on open, and a searchable
              // Select with openOnFocus would pop its dropdown unprompted.
              openOnFocus={false}
              comboboxProps={{ keepMounted: false }}
              checkIconPosition="right"
              renderOption={({ option }) => (
                <Flex align="center" gap={8}>
                  <CharIconCircle characterKey={option.value as CharacterKey} />
                  {option.label}
                </Flex>
              )}
            />
            <div
              className={classes.previewContainer}
              style={{ height: 230, width: panelWidth }}
            >
              <img
                className={classes.previewImage}
                src={previewSrc}
                alt={focusCharacterId ? tc(focusCharacterId) : ''}
              />
            </div>
          </Flex>

          <VerticalDivider />

          <Flex direction="column" style={{ flex: 1 }}>
            <MainStatsColumn
              form={scoringAlgorithmForm}
              statLabel={statLabel}
            />
          </Flex>

          <VerticalDivider />

          <Flex direction="column" gap={3}>
            {allDiscSubStatKeys.map((stat) => (
              <StatValueRow
                key={stat}
                stat={stat}
                label={statLabel(stat)}
                form={scoringAlgorithmForm}
              />
            ))}
          </Flex>
        </Flex>

        <Divider
          className={classes.bottomDivider}
          label={
            <span style={{ fontSize: 15 }}>
              <Text
                component="a"
                href="https://github.com/fribbels/hsr-optimizer/blob/main/docs/guides/en/stat-score.md"
                target="_blank"
                rel="noreferrer"
                size="sm"
                td="underline"
                c="var(--mantine-color-anchor)"
              >
                {/* Hardcoded — same as hsr-optimizer, the guide itself is not localized */}
                How are substat weights used?
              </Text>
            </span>
          }
          labelPosition="center"
        />
      </div>
      <Flex justify="flex-end" gap={8} className={classes.footerActions}>
        <Button variant="default" onClick={close}>
          {t('Scoring.Footer.Cancel')}
        </Button>
        <Button variant="default" onClick={handleResetDefault}>
          {t('Scoring.Footer.Reset')}
        </Button>
        <Button color="red" onClick={handleResetAll}>
          {t('Scoring.Footer.ResetAll')}
        </Button>
        <Button onClick={onModalOk} disabled={!focusCharacterId}>
          {t('Scoring.Footer.Save')}
        </Button>
      </Flex>
    </>
  )
}
