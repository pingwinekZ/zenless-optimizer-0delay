import { Button, Flex, Text } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { characterAsset, wengineAsset } from '../../assets'
import type { CharacterKey } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import type { SavedBuild } from '../../zood'
import { HeaderText } from '../layout'
import styles from './BuildsModal.module.css'

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function comboSummary(build: SavedBuild): string | undefined {
  const tag = build.teamSnapshot?.frames?.[0]?.tag as
    | {
        rotation?: unknown[]
        comboType?: string
        comboKind?: string
        sheet?: string
        name?: string
      }
    | undefined
  if (!tag) return undefined
  if (tag.rotation && tag.rotation.length > 0) {
    const kind =
      tag.comboKind && tag.comboKind !== 'dmg' ? ` ${tag.comboKind}` : ''
    return `Combo ×${tag.rotation.length} ${tag.comboType ?? 'simple'}${kind}`
  }
  if (tag.sheet && tag.name) return `${tag.sheet} ${tag.name}`
  return undefined
}

const TeammatePreview = memo(function TeammatePreview({
  build,
}: {
  build: SavedBuild
}) {
  const { database } = useDatabaseContext()
  // teammates[0] is the main character; preview the two teammates
  const teammates = (build.teamSnapshot?.teammates ?? []).slice(1)
  if (teammates.length === 0) return null
  return (
    <Flex justify="space-between" style={{ marginBlock: 4 }}>
      {teammates.map((ally: { characterKey: string }, idx: number) => {
        if (!ally?.characterKey) return null
        const wengineKey = database.chars.get(
          ally.characterKey as CharacterKey
        )?.wengineKey
        return (
          <Flex key={idx} gap={10}>
            <img
              src={characterAsset(ally.characterKey as CharacterKey, 'circle')}
              className={styles.teammateImg}
              style={{ height: 42 }}
              alt={ally.characterKey}
            />
            {wengineKey ? (
              <img
                src={wengineAsset(wengineKey)}
                className={styles.teammateImg}
                style={{ height: 42 }}
                alt={wengineKey}
              />
            ) : null}
          </Flex>
        )
      })}
    </Flex>
  )
})

type BuildCardProps = {
  build: SavedBuild
  selected: boolean
  onSelect: (name: string) => void
  onLoad?: (build: SavedBuild) => void
  onEquip?: (build: SavedBuild) => void
  onDelete?: (name: string) => void
  preview?: boolean
}

export const BuildCard = memo(function BuildCard({
  build,
  selected,
  onSelect,
  onLoad,
  onEquip,
  onDelete,
  preview,
}: BuildCardProps) {
  const { t } = useTranslation('page_optimize')
  const combo = comboSummary(build)
  return (
    <div
      className={styles.buildCard}
      style={{
        backgroundColor: selected ? 'var(--mantine-color-dark-5)' : undefined,
      }}
      onClick={(e) => {
        onSelect(build.name)
        e.stopPropagation()
      }}
    >
      <Flex direction="column" gap={6}>
        <HeaderText className={styles.buildName}>{build.name}</HeaderText>
        <Text size="xs" c="dimmed">
          {formatDate(build.updatedAt)}
          {build.value !== undefined &&
            ` — Val: ${build.value.toLocaleString()}`}
          {combo && ` — ${combo}`}
        </Text>
        {build.description && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {build.description}
          </Text>
        )}
        <TeammatePreview build={build} />
        {!preview && (
          <Flex gap={5} justify="space-between">
            <Flex gap={5}>
              {onEquip && (
                <Button size="xs" onClick={() => onEquip(build)}>
                  {t('buildsSection.equip', 'Equip')}
                </Button>
              )}
              {onLoad && (
                <Button size="xs" onClick={() => onLoad(build)}>
                  {t('buildsSection.load', 'Load')}
                </Button>
              )}
            </Flex>
            {onDelete && (
              <Button
                size="xs"
                className={styles.deleteButton}
                onClick={() => onDelete(build.name)}
              >
                <IconTrash size={16} />
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  )
})

type BuildListProps = {
  builds: SavedBuild[]
  selectedName: string | null
  onSelect: (name: string | null) => void
  onLoad?: (build: SavedBuild) => void
  onEquip?: (build: SavedBuild) => void
  onDelete?: (name: string) => void
  preview?: boolean
  style?: React.CSSProperties
}

export const BuildList = memo(function BuildList({
  builds,
  selectedName,
  onSelect,
  onLoad,
  onEquip,
  onDelete,
  preview,
  style,
}: BuildListProps) {
  return (
    <Flex
      direction="column"
      className={styles.buildList}
      style={style}
      gap={8}
      onClick={() => onSelect(null)}
    >
      {builds.map((build) => (
        <BuildCard
          key={build.name}
          build={build}
          selected={selectedName === build.name}
          onSelect={onSelect}
          onLoad={onLoad}
          onEquip={onEquip}
          onDelete={onDelete}
          preview={preview}
        />
      ))}
    </Flex>
  )
})
