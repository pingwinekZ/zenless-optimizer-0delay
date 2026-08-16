import { Menu } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { useTranslation } from 'react-i18next'

export function WorkerSelector({
  numWorkers,
  setNumWorkers,
}: {
  numWorkers: number
  setNumWorkers: (w: number) => void
}) {
  const { t } = useTranslation('page_optimize')
  const maxWorkers = navigator.hardwareConcurrency || 8
  return (
    <DropdownButton title={`${numWorkers} Workers`}>
      <Menu.Item disabled>Scales with available CPU cores.</Menu.Item>
      {range(1, maxWorkers).map((n) => (
        <Menu.Item key={n} onClick={() => setNumWorkers(n)}>
          {t('worker', { count: n })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
