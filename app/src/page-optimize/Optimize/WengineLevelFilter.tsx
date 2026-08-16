import { CardSection, Divider, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { memo, useContext } from 'react'
import { wengineMaxLevel } from '../../consts'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { WengineLevelSlider } from '../../ui'

export const WengineLevelFilter = memo(function WengineLevelFilter({
  disabled = false,
}: {
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  return (
    <CardThemed bgt="light">
      <CardSection style={{ display: 'flex', gap: 1 }}>
        <Text fw={700}>Wengine Level Filter</Text>
      </CardSection>
      <Divider />
      <WengineLevelSlider
        levelLow={optConfig?.wlevelLow ?? wengineMaxLevel}
        levelHigh={optConfig?.wlevelHigh ?? wengineMaxLevel}
        setLow={(wlevelLow) =>
          database.optConfigs.set(optConfigId, { wlevelLow })
        }
        setHigh={(wlevelHigh) =>
          database.optConfigs.set(optConfigId, { wlevelHigh })
        }
        setBoth={(wlevelLow, wlevelHigh) =>
          database.optConfigs.set(optConfigId, {
            wlevelLow,
            wlevelHigh,
          })
        }
        disabled={disabled}
      />
    </CardThemed>
  )
})
