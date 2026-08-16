import { Button, Menu } from '@mantine/core'
import {
  IconChevronDown,
  IconEdit,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

export function CharacterMenu({
  hasFocus,
  onAdd,
  onEdit,
  onDelete,
  onOptimize,
}: {
  hasFocus: boolean
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
  onOptimize?: () => void
}) {
  const { t } = useTranslation('page_characters')

  return (
    <Menu trigger="click" position="top-start" width="target">
      <Menu.Target>
        <Button
          style={{
            width: '100%',
            height: 40,
            boxShadow: 'unset',
            borderRadius: 4,
          }}
          leftSection={<IconUser size={16} />}
          rightSection={<IconChevronDown size={16} />}
          variant="default"
        >
          {t('Character Menu')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Character</Menu.Label>
        <Menu.Item leftSection={<IconPlus size={14} />} onClick={onAdd}>
          Add new character
        </Menu.Item>
        <Menu.Item
          leftSection={<IconEdit size={14} />}
          onClick={onEdit}
          disabled={!hasFocus}
        >
          Edit character
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash size={14} />}
          color="red"
          onClick={onDelete}
          disabled={!hasFocus}
        >
          Delete character
        </Menu.Item>

        {onOptimize && (
          <>
            <Menu.Divider />
            <Menu.Label>Optimize</Menu.Label>
            <Menu.Item
              leftSection={<IconPlayerPlay size={14} />}
              onClick={onOptimize}
              disabled={!hasFocus}
            >
              Optimize character
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
