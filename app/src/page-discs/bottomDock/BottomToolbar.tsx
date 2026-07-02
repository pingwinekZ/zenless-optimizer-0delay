import { Button, Group, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconCopy, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDatabaseContext } from '../../db-ui'
import { DiscEditorModal, useDiscEditorModalStore } from '../../ui'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'
import { DiscLocator } from './DiscLocator'

export function BottomToolbarLeft() {
  const selectedDiscId = useDiscTabStore((s) => s.selectedDiscId)
  const selectedDiscsIds = useDiscTabStore((s) => s.selectedDiscsIds)
  const setSelectedDiscsIds = useDiscTabStore((s) => s.setSelectedDiscsIds)
  const { database } = useDatabaseContext()
  const openEditorModal = useDiscEditorModalStore((s) => s.openOverlay)
  const { t } = useTranslation('discTab')
  const { t: tc } = useTranslation('ui')
  void selectedDiscsIds

  const onAdd = useCallback(() => {
    openEditorModal({
      selectedDisc: null,
      onOk: () => {},
    })
  }, [openEditorModal])

  const onEdit = useCallback(
    (id: string) => {
      const disc = database.discs.get(id)
      if (disc) {
        openEditorModal({
          selectedDisc: disc,
          onOk: () => {},
        })
      }
    },
    [database.discs, openEditorModal]
  )

  const onDelete = useCallback(() => {
    if (!selectedDiscId) return
    modals.openConfirmModal({
      title: tc('Confirm'),
      children: t('Toolbar.DeleteDisc.Warning', {
        count: 1,
      }),
      labels: { confirm: tc('Yes'), cancel: tc('Cancel') },
      centered: true,
      onConfirm: () => {
        database.discs.remove(selectedDiscId)
        setSelectedDiscsIds([])
      },
    })
  }, [selectedDiscId, database.discs, setSelectedDiscsIds, t, tc])

  const selectedDisc = selectedDiscId
    ? database.discs.get(selectedDiscId)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <DiscLocator disc={selectedDisc ?? null} compact />
      <Group gap={5} wrap="wrap">
        <Button
          variant="default"
          size="xs"
          w={140}
          leftSection={<IconPlus size={14} />}
          onClick={onAdd}
        >
          {t('Toolbar.AddDisc')}
        </Button>
        <Tooltip label={t('Toolbar.EditDisc')} disabled={!selectedDisc}>
          <Button
            variant="default"
            size="xs"
            w={140}
            leftSection={<IconEdit size={14} />}
            disabled={!selectedDisc}
            onClick={() => selectedDisc && onEdit(selectedDisc.id)}
          >
            {t('Toolbar.EditDisc')}
          </Button>
        </Tooltip>
        <Tooltip
          label={t('Toolbar.DeleteDisc.ButtonText')}
          disabled={!selectedDisc}
        >
          <Button
            variant="default"
            size="xs"
            w={140}
            leftSection={<IconTrash size={14} />}
            disabled={!selectedDisc}
            onClick={onDelete}
          >
            {t('Toolbar.DeleteDisc.ButtonText')}
          </Button>
        </Tooltip>
      </Group>
      <DiscEditorModal />
    </div>
  )
}

export function BottomToolbarRight({ onShowDup }: { onShowDup: () => void }) {
  const { t } = useTranslation('discTab')
  return (
    <Group justify="flex-end">
      <Button
        variant="default"
        size="xs"
        w={170}
        leftSection={<IconCopy size={14} />}
        onClick={onShowDup}
      >
        {t('Toolbar.ShowDupes')}
      </Button>
    </Group>
  )
}

export function useDupModalState() {
  return useBoolState(false)
}
