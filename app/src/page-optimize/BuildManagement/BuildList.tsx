import { Button, Flex } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { type CSSProperties, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { characterAsset, wengineAsset } from '../../assets'
import type { CharacterKey } from '../../consts'
import { isWengineKey } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import type { SavedBuild } from '../../zood'
import { HeaderText } from '../layout'
import styles from './BuildsModal.module.css'

type BuildCardProps = {
  build: SavedBuild
  selected: boolean
  onSelect: (name: string) => void
  onLoad?: (build: SavedBuild) => void
  onEquip?: (build: SavedBuild) => void
  onDelete?: (name: string) => void
  preview?: boolean
}

const BuildCard = memo(function BuildCard({
  build,
  selected,
  onSelect,
  onLoad,
  onEquip,
  onDelete,
  preview,
}: BuildCardProps) {
  const { t } = useTranslation('page_optimize')
  return (
    <div
      className={styles.buildCard}
      style={{ backgroundColor: selected ? 'var(--layer-3)' : undefined }}
      onClick={(e) => {
        onSelect(build.name)
        e.stopPropagation()
      }}
    >
      <Flex direction="column" gap={6}>
        <HeaderText className={styles.buildName}>{build.name}</HeaderText>
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

const teammateImgStyle: CSSProperties = { height: 42 }
const teammateRowStyle: CSSProperties = { marginBlock: 4 }

const TeammatePreview = memo(function TeammatePreview({
  build,
}: {
  build: SavedBuild
}) {
  const { database } = useDatabaseContext()
  // teammates[0] is the main character; preview the two teammates
  const teammates = (build.teamSnapshot?.teammates ?? []).slice(1)
  const hasTeammates = teammates.some(Boolean)
  if (!hasTeammates) return null

  return (
    <Flex justify="space-between" style={teammateRowStyle}>
      {teammates.map((ally, idx) => {
        if (!ally?.characterKey) return null
        // Save-time gear first (old builds fall back to live state)
        const savedWengine =
          ally.wengineKey && isWengineKey(ally.wengineKey)
            ? ally.wengineKey
            : undefined
        const wengineKey =
          savedWengine ??
          database.chars.get(ally.characterKey as CharacterKey)?.wengineKey
        return (
          <Flex key={idx} gap={10}>
            <img
              src={characterAsset(ally.characterKey as CharacterKey, 'circle')}
              className={styles.teammateImg}
              style={teammateImgStyle}
              alt={ally.characterKey}
            />
            {wengineKey ? (
              <img
                src={wengineAsset(wengineKey)}
                className={styles.teammateImg}
                style={teammateImgStyle}
                alt={wengineKey}
              />
            ) : null}
          </Flex>
        )
      })}
    </Flex>
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
  style?: CSSProperties
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
