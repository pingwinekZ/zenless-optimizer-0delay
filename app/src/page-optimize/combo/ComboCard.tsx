import {
  ActionIcon,
  Button,
  Flex,
  ScrollArea,
  SegmentedControl,
  Text,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import {
  IconMinus,
  IconPlus,
  IconRefresh,
  IconSettings,
} from '@tabler/icons-react'
import { useCallback, useMemo } from 'react'
import type { CharacterKey } from '../../consts'
import type { ComboHit, ComboTypeKey, Team } from '../../db'
import { getTeamFrame0, MAX_COMBO_HITS, remapComboState } from '../../db'
import { useDatabaseContext } from '../../db-ui'
import { HeaderText } from '../layout'
import { CascaderSelect } from './CascaderSelect'
import classes from './ComboCard.module.css'
import { ComboDrawer } from './ComboDrawer'
import {
  hitValue,
  parseHitValue,
  useComboFormulaGroups,
} from './useComboDrawerStore'
import type { ComboMember } from './useComboMembers'
import { filterRelevantConditionals, useComboMembers } from './useComboMembers'

const controlSize = 28

const compactInputStyles = {
  input: {
    height: 18,
    minHeight: 18,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    paddingBlock: 0,
  },
}

function IndexLabel({ index }: { index: number }) {
  return (
    <span
      style={{
        fontSize: 12,
        whiteSpace: 'nowrap',
        width: '100%',
        textAlign: 'left',
      }}
    >{`${index}.`}</span>
  )
}

export function ComboCard({
  characterKey,
  team,
}: {
  characterKey: CharacterKey
  team: Team
}) {
  const members = useComboMembers(characterKey, team)
  const { rotation, comboType, writeRotation, setType } = useComboWriter(
    characterKey,
    team,
    members
  )
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)

  return (
    <Flex direction="column" gap={8}>
      <Flex justify="space-between" align="center">
        <HeaderText>Combo DMG</HeaderText>
      </Flex>
      <SegmentedControl
        fullWidth
        value={comboType}
        onChange={(value) => setType(value as ComboTypeKey)}
        data={[
          { label: 'Simple', value: 'simple' },
          { label: 'Advanced', value: 'advanced' },
        ]}
      />

      <ComboBasicDefinition
        characterKey={characterKey}
        rotation={rotation}
        comboType={comboType}
        writeRotation={writeRotation}
      />

      <Flex
        direction="column"
        gap={8}
        className={classes.advancedButtonContainer}
      >
        <Button
          variant="default"
          onMouseDown={(e: React.MouseEvent) => {
            if (e.button === 0) openDrawer()
          }}
          leftSection={<IconSettings size={16} stroke={1.5} />}
          disabled={comboType === 'simple' || rotation.length === 0}
        >
          Rotation
        </Button>
      </Flex>
      <ComboDrawer
        opened={drawerOpened}
        close={closeDrawer}
        characterKey={characterKey}
        team={team}
        members={members}
      />
    </Flex>
  )
}

function useComboWriter(
  characterKey: CharacterKey,
  team: Team,
  members: ComboMember[]
) {
  const { database } = useDatabaseContext()
  const { tag: target } = getTeamFrame0(team)
  const rotation = useMemo(() => target?.rotation ?? [], [target])
  const comboType: ComboTypeKey = target?.comboType ?? 'simple'

  /** Write a new rotation, preserving advanced per-hit values by position. */
  const writeRotation = useCallback(
    (hits: ComboHit[], type: ComboTypeKey) => {
      if (hits.length === 0) {
        database.teams.setFrame0(characterKey, { tag: undefined })
        return
      }
      database.teams.setFrame0(characterKey, (frame) => ({
        tag: {
          ...frame.tag,
          rotation: hits,
          comboType: type === 'advanced' ? 'advanced' : undefined,
          comboStateJson:
            type === 'advanced'
              ? remapComboState(
                  filterRelevantConditionals(frame.conditionals, members),
                  frame.tag?.comboStateJson,
                  hits.map((_, i) => i)
                )
              : undefined,
        },
      }))
    },
    [database, characterKey, members]
  )

  const setType = useCallback(
    (type: ComboTypeKey) => writeRotation(rotation, type),
    [writeRotation, rotation]
  )

  return { rotation, comboType, writeRotation, setType }
}

function addHit(
  rotation: ComboHit[],
  writeRotation: (hits: ComboHit[], type: ComboTypeKey) => void,
  comboType: ComboTypeKey,
  firstFormula: ComboHit | undefined
) {
  if (rotation.length >= MAX_COMBO_HITS) return
  const last = rotation[rotation.length - 1]
  const hit = last ? { ...last } : firstFormula
  if (!hit) return
  writeRotation([...rotation, hit], comboType)
}

function removeLastHit(
  rotation: ComboHit[],
  writeRotation: (hits: ComboHit[], type: ComboTypeKey) => void,
  comboType: ComboTypeKey
) {
  if (rotation.length === 0) return
  writeRotation(rotation.slice(0, -1), comboType)
}

function HitAbilitySelector({
  index,
  hit,
  disabled,
  onChange,
}: {
  index: number
  hit: ComboHit | undefined
  disabled: boolean
  onChange: (value: string | null) => void
}) {
  const groups = useComboFormulaGroups()
  return (
    <CascaderSelect
      data={groups}
      value={hit ? hitValue(hit.sheet, hit.name) : null}
      placeholder="Ability"
      variant="unstyled"
      leftSection={<IndexLabel index={index} />}
      leftSectionWidth={24}
      styles={compactInputStyles}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

function ComboBasicDefinition({
  characterKey,
  rotation,
  comboType,
  writeRotation,
}: {
  characterKey: CharacterKey
  rotation: ComboHit[]
  comboType: ComboTypeKey
  writeRotation: (hits: ComboHit[], type: ComboTypeKey) => void
}) {
  const { database } = useDatabaseContext()
  const groups = useComboFormulaGroups()
  const firstFormula: ComboHit | undefined = (() => {
    const g = groups[0]?.options[0]?.value
    const parsed = parseHitValue(g ?? null)
    return parsed ? { sheet: parsed.sheet, name: parsed.name } : undefined
  })()

  const disabled = comboType === 'simple'
  const showEditable = comboType === 'advanced'

  const setHit = (index: number, value: string | null) => {
    const parsed = parseHitValue(value)
    if (!parsed) return
    if (index < rotation.length) {
      writeRotation(
        rotation.map((h, i) =>
          i === index ? { ...h, sheet: parsed.sheet, name: parsed.name } : h
        ),
        comboType
      )
    } else if (rotation.length < MAX_COMBO_HITS) {
      writeRotation(
        [...rotation, { sheet: parsed.sheet, name: parsed.name }],
        comboType
      )
    }
  }

  const resetClicked = () => {
    modals.openConfirmModal({
      title: 'Confirm',
      children: 'Clear the rotation and advanced buff overrides?',
      labels: { confirm: 'Yes', cancel: 'Cancel' },
      centered: true,
      onConfirm: () =>
        database.teams.setFrame0(characterKey, { tag: undefined }),
    })
  }

  // Editable rows: one per hit plus a trailing empty slot (HSR parity:
  // rows render while defined or within the first slots).
  const editableCount = Math.min(rotation.length + 1, MAX_COMBO_HITS)

  return (
    <Flex className={classes.comboContainer}>
      <Flex
        direction="column"
        flex={1}
        className={classes.abilitiesColumn}
        gap={3}
      >
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Flex
            direction="column"
            flex={1}
            className={classes.abilitiesColumn}
            style={{ display: showEditable ? 'flex' : 'none' }}
            gap={3}
          >
            {rotation.length === 0 && editableCount === 1 ? (
              <HitAbilitySelector
                index={1}
                hit={undefined}
                disabled={disabled}
                onChange={(v) => setHit(0, v)}
              />
            ) : (
              Array.from({ length: editableCount }, (_, i) => (
                <HitAbilitySelector
                  key={i}
                  index={i + 1}
                  hit={rotation[i]}
                  disabled={disabled || i >= rotation.length}
                  onChange={(v) => setHit(i, v)}
                />
              ))
            )}
          </Flex>

          <Flex
            direction="column"
            flex={1}
            className={`${classes.abilitiesColumn} ${classes.simpleAbilities}`}
            style={{ display: showEditable ? 'none' : 'flex' }}
            gap={3}
          >
            {rotation.length === 0 ? (
              <Text size="xs" c="dimmed">
                Single target — configure a rotation to sum multiple hits.
              </Text>
            ) : (
              rotation.map((hit, i) => (
                <HitAbilitySelector
                  key={`${hit.sheet}_${hit.name}_${i}`}
                  index={i + 1}
                  hit={hit}
                  disabled={true}
                  onChange={() => {}}
                />
              ))
            )}
          </Flex>
        </ScrollArea>
      </Flex>

      <Flex direction="column" gap={controlSize / 2} w={controlSize}>
        <Flex direction="column" gap={5}>
          <Tooltip
            label="Reset rotation"
            position="right"
            openDelay={300}
            withArrow
          >
            <ActionIcon
              variant="default"
              w="100%"
              h={controlSize}
              onClick={resetClicked}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Add hit" position="right" openDelay={300} withArrow>
            <ActionIcon
              variant="default"
              w="100%"
              h={controlSize}
              onClick={() =>
                addHit(rotation, writeRotation, comboType, firstFormula)
              }
              disabled={disabled}
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label="Remove last hit"
            position="right"
            openDelay={300}
            withArrow
          >
            <ActionIcon
              variant="default"
              w="100%"
              h={controlSize}
              onClick={() => removeLastHit(rotation, writeRotation, comboType)}
              disabled={disabled}
            >
              <IconMinus size={16} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  )
}
