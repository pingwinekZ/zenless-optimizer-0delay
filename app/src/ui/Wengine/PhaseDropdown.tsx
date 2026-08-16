import { Menu } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { allPhaseKeys, type PhaseKey } from '../../consts'

export function PhaseDropdown({
  phase,
  setPhase,
  disabled = false,
}: {
  phase: PhaseKey
  setPhase: (r: PhaseKey) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('ui')
  return (
    <DropdownButton title={t('phase', { value: phase })} disabled={disabled}>
      {allPhaseKeys.map((r) => (
        <Menu.Item key={r} onClick={() => setPhase(r)} disabled={phase === r}>
          {t('phase', { value: r })}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
