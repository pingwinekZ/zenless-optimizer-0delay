import { Button, Group, Menu } from '@mantine/core'
import { Trans, useTranslation } from 'react-i18next'
import { DropdownButton } from './DropdownButton'

export function SortByButton<Key extends string>({
  sortKeys,
  value,
  onChange,
  ascending,
  onChangeAsc,
  ...props
}: {
  sortKeys: Key[]
  value: Key
  onChange: (value: Key) => void
  ascending: boolean
  onChangeAsc: (value: boolean) => void
}) {
  const { t } = useTranslation('ui')
  return (
    <Group gap="xs" align="center">
      <Trans t={t} i18nKey="sortBy">
        Sort by:{' '}
      </Trans>
      <Button.Group {...(props as any)}>
        <DropdownButton
          title={
            <Trans t={t} i18nKey={`sortMap.${value}`}>
              {{ value: t(`sortMap.${value}`) }}
            </Trans>
          }
        >
          {sortKeys.map((key) => (
            <Menu.Item
              key={key}
              disabled={value === key}
              onClick={() => onChange(key)}
            >
              {t(`sortMap.${key}`)}
            </Menu.Item>
          ))}
        </DropdownButton>
        <Button
          onClick={() => onChangeAsc(!ascending)}
          leftSection={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ transform: ascending ? 'scale(1, -1)' : 'scale(1)' }}
            >
              <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
            </svg>
          }
        >
          {ascending ? (
            <Trans t={t} i18nKey="ascending">
              Ascending
            </Trans>
          ) : (
            <Trans t={t} i18nKey="descending">
              Descending
            </Trans>
          )}
        </Button>
      </Button.Group>
    </Group>
  )
}
