import { Button, Flex, Modal } from '@mantine/core'
import { modals } from '@mantine/modals'
import i18next from 'i18next'
import { memo, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import { OptConfigContext, useCharacter, useDatabaseContext } from '../../db-ui'
import { Message } from '../../ui'
import type { SavedBuild } from '../../zood'
import { BuildList } from './BuildList'
import { BuildPreview } from './BuildPreview'
import styles from './BuildsModal.module.css'
import {
  buildEquipConflicts,
  clearBuilds,
  deleteBuild,
  equipBuild,
  loadBuildInOptimizer,
} from './buildService'

export const LoadBuildModal = memo(function LoadBuildModal({
  opened,
  onClose,
  characterKey,
}: {
  opened: boolean
  onClose: () => void
  characterKey: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { optConfigId } = useContext(OptConfigContext)
  const character = useCharacter(characterKey ?? '')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const builds = useMemo(
    () =>
      [...(character?.builds ?? [])].sort((a, b) => b.updatedAt - a.updatedAt),
    [character]
  )

  useEffect(() => {
    if (opened) setSelectedName(builds[0]?.name ?? null)
    // Select the first build when opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  const build =
    selectedName !== null
      ? (builds.find((b) => b.name === selectedName) ?? null)
      : null

  if (!characterKey) return null

  function handleLoad(target: SavedBuild) {
    if (!characterKey) return
    loadBuildInOptimizer(database, target, { characterKey, optConfigId })
    onClose()
  }

  function handleEquip(target: SavedBuild) {
    if (!characterKey) return
    const conflicts = buildEquipConflicts(database, characterKey, target)
    const apply = () => {
      if (!characterKey) return
      equipBuild(database, characterKey, target)
      Message.success(
        t('buildsSection.successEquip', 'Equipped {{buildName}}', {
          buildName: target.name,
        })
      )
      onClose()
    }
    if (conflicts.length === 0) {
      apply()
      return
    }
    const owners = [...new Set(conflicts.map((c) => c.owner))].join(', ')
    modals.openConfirmModal({
      title: t('buildsSection.equip', 'Equip'),
      children: `${t(
        'buildsSection.confirmEquip',
        'Some discs are equipped by other characters. Equip them anyway?'
      )} (${owners})`,
      labels: {
        confirm: t('buildsSection.equip', 'Equip'),
        cancel: t('buildsSection.cancel', 'Cancel'),
      },
      centered: true,
      onConfirm: apply,
    })
  }

  function handleDelete(name: string) {
    if (!characterKey) return
    const key = characterKey
    modals.openConfirmModal({
      title: t('buildsSection.delete', 'Delete'),
      children: t('buildsSection.confirmDeleteSingle', {
        defaultValue: 'Are you sure you want to delete build {{name}}?',
        name,
      }),
      labels: {
        confirm: t('buildsSection.delete', 'Delete'),
        cancel: t('buildsSection.cancel', 'Cancel'),
      },
      centered: true,
      onConfirm: () => {
        deleteBuild(database, key, name)
        Message.success(
          t('buildsSection.successDeleteSingle', 'Deleted build {{name}}', {
            name,
          })
        )
        const remaining = builds.filter((b) => b.name !== name)
        setSelectedName(remaining[0]?.name ?? null)
        if (remaining.length === 0) onClose()
      },
    })
  }

  function handleDeleteAll() {
    if (!characterKey) return
    const key = characterKey
    modals.openConfirmModal({
      title: t('buildsSection.deleteAll', 'Delete All'),
      children: t(
        'buildsSection.confirmDeleteAll',
        'Are you sure you want to delete all builds?'
      ),
      labels: {
        confirm: t('buildsSection.deleteAll', 'Delete All'),
        cancel: t('buildsSection.cancel', 'Cancel'),
      },
      centered: true,
      confirmProps: { color: 'red' },
      onConfirm: () => {
        clearBuilds(database, key)
        Message.success(
          t(
            'buildsSection.successDeleteAll',
            'Deleted all builds for {{character}}',
            {
              character: i18next.t(`charNames_gen:${key}`, {
                defaultValue: key,
              }),
            }
          )
        )
        setSelectedName(null)
        onClose()
      },
    })
  }

  function handleCancel() {
    setSelectedName(null)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      size={builds.length > 0 ? 1550 : 300}
      centered
    >
      {builds.length === 0 ? (
        <>{t('buildsSection.noBuilds', 'No saved builds yet.')}</>
      ) : (
        <>
          <Flex gap={10}>
            <BuildList
              builds={builds}
              selectedName={selectedName}
              onSelect={setSelectedName}
              onLoad={handleLoad}
              onEquip={handleEquip}
              onDelete={handleDelete}
            />
            {characterKey && (
              <BuildPreview build={build} characterKey={characterKey} />
            )}
          </Flex>
          <Flex justify="flex-end" gap={8} className={styles.footerActions}>
            <Button color="red" onClick={handleDeleteAll}>
              {t('buildsSection.deleteAll', 'Delete All')}
            </Button>
            <Button variant="default" onClick={handleCancel}>
              {t('buildsSection.cancel', 'Cancel')}
            </Button>
          </Flex>
        </>
      )}
    </Modal>
  )
})
