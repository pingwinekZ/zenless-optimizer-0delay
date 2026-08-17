import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Image,
  Menu,
  Modal,
  SegmentedControl,
  Skeleton,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { DropdownButton, ImgIcon } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { commonDefIcon, wengineAsset } from '../assets'
import {
  allPhaseKeys,
  allSkillKeys,
  type CharacterKey,
  coreByLevel,
  type PhaseKey,
  potentialLimits,
  type SkillKey,
  skillByLevel,
  type WengineKey,
} from '../consts'
import { useDatabaseContext } from '../db-ui'
import { getCharStat } from '../stats'
import {
  CharacterName,
  useCharacterTabStore,
  WengineName,
  WengineSelectionModal,
} from '../ui'

type CharacterEditForm = {
  mindscape: number
  wengineKey: WengineKey | null
  wenginePhase: PhaseKey
  level: number
  basic: number
  dodge: number
  assist: number
  special: number
  chain: number
  core: number
  potential: number
}

export function CharacterEditModal({
  characterKey,
  onClose,
}: {
  characterKey: CharacterKey | null
  onClose: () => void
}) {
  const { t } = useTranslation('page_characters')
  const { database } = useDatabaseContext()
  const [wengineSelectOpen, setWengineSelectOpen] = useState(false)

  const [form, setForm] = useState<CharacterEditForm>({
    mindscape: 0,
    wengineKey: null,
    wenginePhase: 1,
    level: 1,
    basic: 1,
    dodge: 1,
    assist: 1,
    special: 1,
    chain: 1,
    core: 0,
    potential: 0,
  })
  const [initialForm, setInitialForm] = useState<CharacterEditForm | null>(null)

  useEffect(() => {
    if (!characterKey) {
      setInitialForm(null)
      return
    }
    const char = database.chars.get(characterKey)
    if (!char) return
    const f: CharacterEditForm = {
      mindscape: char.mindscape,
      wengineKey: char.wengineKey || null,
      wenginePhase: char.wenginePhase as PhaseKey,
      level: char.level,
      basic: char.basic,
      dodge: char.dodge,
      assist: char.assist,
      special: char.special,
      chain: char.chain,
      core: char.core,
      potential: char.potential,
    }
    setForm(f)
    setInitialForm(f)
  }, [characterKey, database])

  const hasChanges = useMemo(() => {
    if (!initialForm) return false
    return (
      initialForm.mindscape !== form.mindscape ||
      initialForm.wengineKey !== form.wengineKey ||
      initialForm.wenginePhase !== form.wenginePhase ||
      initialForm.basic !== form.basic ||
      initialForm.dodge !== form.dodge ||
      initialForm.assist !== form.assist ||
      initialForm.special !== form.special ||
      initialForm.chain !== form.chain ||
      initialForm.core !== form.core ||
      initialForm.potential !== form.potential
    )
  }, [initialForm, form])

  const charStat = characterKey ? getCharStat(characterKey) : null
  const hasPotential = useMemo(
    () => (charStat?.potentialParams.length ?? 0) > 0,
    [charStat]
  )

  const onSave = () => {
    if (!characterKey) return

    database.chars.set(characterKey, {
      mindscape: form.mindscape,
      wengineKey: form.wengineKey ?? '',
      wenginePhase: form.wenginePhase,
      basic: form.basic,
      dodge: form.dodge,
      assist: form.assist,
      special: form.special,
      chain: form.chain,
      core: form.core,
      potential: form.potential,
    })

    useCharacterTabStore.getState().setFocusCharacter(characterKey)
    onClose()
  }

  return (
    <>
      <WengineSelectionModal
        show={wengineSelectOpen}
        onHide={() => setWengineSelectOpen(false)}
        onSelect={(wKey) => {
          setForm((f) => ({ ...f, wengineKey: wKey || null }))
          setWengineSelectOpen(false)
        }}
        wengineTypeFilter={charStat?.specialty ?? ''}
        characterKey={characterKey ?? undefined}
        zIndex={210}
      />
      <Modal
        opened={!!characterKey}
        onClose={onClose}
        size={500}
        centered
        withCloseButton={false}
        padding="md"
      >
        <Suspense fallback={<Skeleton height={300} />}>
          <Group mb="md">
            <Text fw={700} size="lg">
              {characterKey && <CharacterName characterKey={characterKey} />}
            </Text>
            <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
              <IconX />
            </ActionIcon>
          </Group>

          <Text fw={600} mb="xs">
            {t('mindscapeTitle')}
          </Text>
          <Box mb="md">
            <SegmentedControl
              data={[0, 1, 2, 3, 4, 5, 6].map((m) => ({
                value: String(m),
                label: `M${m}`,
              }))}
              value={String(form.mindscape)}
              onChange={(v) => setForm((f) => ({ ...f, mindscape: Number(v) }))}
              fullWidth
              size="xs"
            />
          </Box>

          {hasPotential && (
            <>
              <Text fw={600} mb="xs">
                {t('potential')}
              </Text>
              <Box mb="md">
                <SegmentedControl
                  data={potentialLimits.map((p) => ({
                    value: String(p),
                    label: `P${p}`,
                  }))}
                  value={String(form.potential)}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, potential: Number(v) }))
                  }
                  fullWidth
                  size="xs"
                />
              </Box>
            </>
          )}
          <Text fw={600} mb={4}>
            {t('editCharacter.skillLevels')}
          </Text>
          <Box mb="md">
            <Grid columns={3}>
              {allSkillKeys.map((sk) => (
                <Grid.Col span={1} key={sk}>
                  <SkillLevelButton
                    skillKey={sk}
                    value={form[sk]}
                    maxLevel={skillByLevel(form.level)}
                    onChange={(v) => setForm((f) => ({ ...f, [sk]: v }))}
                  />
                </Grid.Col>
              ))}
              <Grid.Col span={1}>
                <CoreLevelButton
                  value={form.core}
                  maxLevel={coreByLevel(form.level)}
                  onChange={(v) => setForm((f) => ({ ...f, core: v }))}
                />
              </Grid.Col>
            </Grid>
          </Box>

          <Text fw={600} mb="xs">
            {t('editCharacter.wengine')}
          </Text>
          <Box mb="md">
            {form.wengineKey ? (
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Image
                  src={wengineAsset(form.wengineKey)}
                  w={48}
                  h={48}
                  fit="contain"
                />
                <Box>
                  <Text fw={500}>
                    <WengineName wKey={form.wengineKey} />
                  </Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setWengineSelectOpen(true)}
                  >
                    {t('editCharacter.change')}
                  </Button>
                </Box>
                <ActionIcon
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setForm((f) => ({ ...f, wengineKey: null }))}
                >
                  <IconX />
                </ActionIcon>
              </Box>
            ) : (
              <Button
                variant="default"
                fullWidth
                onClick={() => setWengineSelectOpen(true)}
              >
                {t('editCharacter.selectWengine')}
              </Button>
            )}
            {form.wengineKey && (
              <>
                <Text size="sm" fw={500} mb={4}>
                  {t('editCharacter.phase')}
                </Text>
                <SegmentedControl
                  data={allPhaseKeys.map((p) => ({
                    value: String(p),
                    label: `P${p}`,
                  }))}
                  value={String(form.wenginePhase)}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      wenginePhase: Number(v) as PhaseKey,
                    }))
                  }
                  fullWidth
                  size="xs"
                />
              </>
            )}
          </Box>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>
              {t('editCharacter.cancel')}
            </Button>
            <Button onClick={onSave} disabled={!hasChanges}>
              {t('editCharacter.save')}
            </Button>
          </Group>
        </Suspense>
      </Modal>
    </>
  )
}

function SkillLevelButton({
  skillKey,
  value,
  maxLevel,
  onChange,
}: {
  skillKey: SkillKey
  value: number
  maxLevel: number
  onChange: (v: number) => void
}) {
  const { t } = useTranslation('page_characters')
  return (
    <DropdownButton
      fullWidth
      title={t(skillKey, { level: value })}
      color="primary"
      leftSection={
        <ImgIcon src={commonDefIcon(skillKey)} size={1.5} sideMargin />
      }
    >
      {range(1, maxLevel).map((i) => (
        <Menu.Item key={i} disabled={value === i} onClick={() => onChange(i)}>
          {t(skillKey, { level: i })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}

function CoreLevelButton({
  value,
  maxLevel,
  onChange,
}: {
  value: number
  maxLevel: number
  onChange: (v: number) => void
}) {
  const { t } = useTranslation('page_characters')
  return (
    <DropdownButton
      fullWidth
      title={t('core', { level: value })}
      color="primary"
      leftSection={
        <ImgIcon src={commonDefIcon('core')} size={1.5} sideMargin />
      }
    >
      {range(0, maxLevel).map((i) => (
        <Menu.Item key={i} disabled={value === i} onClick={() => onChange(i)}>
          {t('core', { level: i })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
