import { memo, useContext } from 'react'
import { discMaxLevel } from '../../consts'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { DiscLevelSlider } from '../../ui'

export const DiscLevelFilter = memo(function DiscLevelFilter({
  disabled = false,
}: {
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  return (
    <DiscLevelSlider
      levelLow={optConfig?.levelLow ?? discMaxLevel['S']}
      levelHigh={optConfig?.levelHigh ?? discMaxLevel['S']}
      setLow={(levelLow) => database.optConfigs.set(optConfigId, { levelLow })}
      setHigh={(levelHigh) =>
        database.optConfigs.set(optConfigId, { levelHigh })
      }
      setBoth={(levelLow, levelHigh) =>
        database.optConfigs.set(optConfigId, {
          levelLow,
          levelHigh,
        })
      }
      disabled={disabled}
    />
  )
})
