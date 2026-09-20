import { CharacterContext } from '@zenless-optimizer/zzz/db-ui'
import { EquipGrid } from '@zenless-optimizer/zzz/ui'
import { useContext } from 'react'

const columns = { xs: 2, sm: 1, md: 2, lg: 3, xl: 4 } as const
export function EquippedGrid({ onClick }: { onClick?: () => void }) {
  const character = useContext(CharacterContext)

  return (
    <EquipGrid
      discIds={character?.equippedDiscs}
      wengineKey={character?.wengineKey || ''}
      onClick={onClick}
      columns={columns}
    />
  )
}
