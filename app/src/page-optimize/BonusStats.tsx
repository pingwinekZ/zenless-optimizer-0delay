import { ActionIcon, CardSection, MenuItem, Stack, Text } from '@mantine/core'
import { IconCheckbox, IconSquare, IconTrash } from '@tabler/icons-react'
import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import {
  CardThemed,
  ColorText,
  DropdownButton,
  NumberInputLazy,
  TextFieldLazy,
} from '@zenless-optimizer/common/ui'
import { stableArr } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { StatKey } from '../consts'
import { allAttributeAnomalyKeys } from '../consts'
import type { BonusStatKey, BonusStatTag, TeamBonusStat } from '../db'
import {
  bonusStatDamageTypes,
  bonusStatDmgTypeIncStats,
  bonusStatKeys,
  bonusStatQtKeys,
  newBonusStatTag,
} from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import type { Attribute, Tag } from '../formula'
import { qtMap, TagDisplay } from '../formula-ui'
import { AttributeName, StatDisplay } from '../ui'
import { AfterShockToggleButton } from './AfterShockToggleButton'
import { DmgTypeDropdown } from './DmgTypeDropdown'

export function BonusStatsSection() {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const bonusStats = team.frames[0]?.bonusStats ?? stableArr<TeamBonusStat>()
  const charMetaDesc = useDataManagerBase(
    database.charMeta,
    characterKey
  )?.description
  const setStat = useCallback(
    (
      tag: BonusStatTag,
      value: number | null,
      isEnabled: boolean,
      index?: number
    ) =>
      database.teams.setFrameBonusStat(
        characterKey,
        0,
        tag,
        value,
        isEnabled,
        index
      ),
    [database.teams, characterKey]
  )
  const newTarget = (q: BonusStatKey) =>
    database.teams.setFrameBonusStat(
      characterKey,
      0,
      newBonusStatTag(q),
      0,
      false
    )
  const setDescription = useCallback(
    (description: string | undefined) => {
      database.charMeta.set(characterKey, { description })
    },
    [database.charMeta, characterKey]
  )

  return (
    <Stack gap={1}>
      {bonusStats.map(({ tag, value, disabled }, i) => (
        <BonusStatDisplay
          key={JSON.stringify(tag) + i}
          tag={tag}
          value={value}
          disabled={disabled}
          setValue={(value) => setStat(tag, value, disabled, i)}
          onDelete={() => setStat(tag, null, disabled, i)}
          setTag={(tag) => setStat(tag, value, disabled, i)}
          toggleDisabled={() => setStat(tag, value, !disabled, i)}
        />
      ))}
      <InitialStatDropdown onSelect={newTarget} />
      <TextFieldLazy
        placeholder={t('bonusStatsNotes')}
        value={charMetaDesc}
        disabled={!characterKey}
        onChange={(value) => setDescription(value)}
      />
    </Stack>
  )
}

function InitialStatDropdown({
  tag,
  onSelect,
}: {
  tag?: Tag
  onSelect: (key: BonusStatKey) => void
}) {
  return (
    <DropdownButton
      title={(tag && <TagDisplay tag={tag} />) ?? 'Add Bonus Stat'}
    >
      {bonusStatKeys.map((statKey) => (
        <MenuItem key={statKey} onClick={() => onSelect(statKey)}>
          <StatDisplay statKey={statKey as StatKey} showPercent />
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function BonusStatDisplay({
  tag,
  setTag,
  value,
  disabled,
  setValue,
  onDelete,
  toggleDisabled,
}: {
  tag: BonusStatTag
  setTag: (tag: BonusStatTag) => void
  value: number
  disabled: boolean
  setValue: (value: number) => void
  onDelete: () => void
  toggleDisabled: () => void
}) {
  return (
    <CardThemed bgt="light" style={{ opacity: disabled ? 0.4 : undefined }}>
      <CardSection
        style={{
          display: 'flex',
          gap: 1,
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ActionIcon onClick={toggleDisabled}>
          {disabled ? <IconSquare size={16} /> : <IconCheckbox size={16} />}
        </ActionIcon>
        <Text>
          <TagDisplay tag={tag} />
        </Text>
        <QtDropdown qt={tag.qt} setQt={(qt) => setTag({ ...tag, qt })} />
        {['dmg_', 'sheer_dmg_', 'resIgn_'].includes(tag.q) && (
          <AttributeDropdown
            tag={tag}
            setAttribute={(ele) => {
              const { attribute, ...rest } = tag
              setTag(ele ? { ...rest, attribute: ele } : rest)
            }}
          />
        )}
        {bonusStatDmgTypeIncStats.includes(
          tag.q as (typeof bonusStatDmgTypeIncStats)[number]
        ) && (
          <DmgTypeDropdown
            dmgType={tag.damageType1}
            keys={bonusStatDamageTypes}
            setDmgType={(dmgType) => {
              const { damageType1, ...rest } = tag
              setTag(dmgType ? { ...rest, damageType1: dmgType } : rest)
            }}
          />
        )}
        {(['dmg_', 'crit_dmg_'] as const).includes(
          tag.q as 'dmg_' | 'crit_dmg_'
        ) && (
          <AfterShockToggleButton
            isAftershock={tag.damageType2 === 'aftershock'}
            setAftershock={(aftershock) => {
              const { damageType2, ...rest } = tag
              setTag(aftershock ? { ...rest, damageType2: 'aftershock' } : rest)
            }}
          />
        )}
        <NumberInputLazy
          float
          value={value}
          style={{ flexBasis: 100, height: '100%' }}
          onChange={setValue}
          placeholder="Stat Value"
          size="sm"
        />
        <ActionIcon aria-label="Delete Bonus Stat" onClick={onDelete}>
          <IconTrash size={16} />
        </ActionIcon>
      </CardSection>
    </CardThemed>
  )
}

function AttributeDropdown({
  tag,
  setAttribute,
}: {
  tag: BonusStatTag
  setAttribute: (ele: Attribute | null) => void
}) {
  return (
    <DropdownButton
      title={
        tag.attribute ? (
          <AttributeName attribute={tag.attribute} />
        ) : (
          'No Attribute'
        )
      }
      color={tag.attribute!}
    >
      <MenuItem onClick={() => setAttribute(null)}>No Attribute</MenuItem>
      {/* lumiflux DMG bonus doesn't exist - exclude from bonus stats */}
      {allAttributeAnomalyKeys.map((attr) => (
        <MenuItem key={attr} onClick={() => setAttribute(attr)}>
          <ColorText color={attr}>
            <AttributeName attribute={attr} />
          </ColorText>
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function QtDropdown({
  qt,
  setQt,
}: {
  qt: Tag['qt']
  setQt: (ele: (typeof bonusStatQtKeys)[number]) => void
}) {
  return (
    <DropdownButton title={qt && qtMap[qt as keyof typeof qtMap]}>
      {bonusStatQtKeys.map((q) => (
        <MenuItem
          key={q}
          onClick={() => setQt(q)}
          style={
            qt === q
              ? { backgroundColor: 'var(--mantine-color-blue-light)' }
              : undefined
          }
          disabled={qt === q}
        >
          {qtMap[q]}
        </MenuItem>
      ))}
    </DropdownButton>
  )
}
