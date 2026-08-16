import { NumberInput, Popover } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { discDefIcon } from '../../assets'
import type { ICachedDisc } from '../../db'
import { useDatabaseContext } from '../../db-ui'

type LocatorFilters = { set?: string; slot?: string }

const DEFAULT_INVENTORY_WIDTH = 6
const DEFAULT_ROW_LIMIT = 8

export function DiscLocator({
  disc,
  compact = false,
  style,
}: {
  disc: ICachedDisc | null
  compact?: boolean
  style?: React.CSSProperties
}) {
  const { database } = useDatabaseContext()
  const allDiscs: readonly ICachedDisc[] = useDataManagerValues(database.discs)
  const [inventoryWidth, setInventoryWidth] = useState(DEFAULT_INVENTORY_WIDTH)
  const [rowLimit, setRowLimit] = useState(DEFAULT_ROW_LIMIT)
  const [relicPositionIndex, setRelicPositionIndex] = useState(0)
  const [locatorFilters, setLocatorFilters] = useState<LocatorFilters>({})
  const { t } = useTranslation('discTab', { keyPrefix: 'RelicLocator' })

  useEffect(() => {
    if (!disc) {
      setRelicPositionIndex(0)
      setLocatorFilters({})
      return
    }
    const indexLimit = Math.max(1, rowLimit) * Math.max(1, inventoryWidth)
    const newerDiscs = allDiscs.filter((d) => d.id > disc.id)

    const partFiltered = newerDiscs.filter(
      (d) => disc.slotKey === d.slotKey
    ).length
    if (partFiltered < indexLimit) {
      setRelicPositionIndex(partFiltered)
      setLocatorFilters({ slot: disc.slotKey })
      return
    }
    const filtered = newerDiscs.filter(
      (d) => disc.slotKey === d.slotKey && disc.setKey === d.setKey
    ).length
    setRelicPositionIndex(filtered)
    setLocatorFilters({ set: disc.setKey, slot: disc.slotKey })
  }, [disc, allDiscs, inventoryWidth, rowLimit])

  return (
    <Popover>
      <Popover.Target>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            paddingLeft: compact ? 6 : 8,
            paddingRight: compact ? 6 : 10,
            width: compact ? 160 : 285,
            marginTop: compact ? 0 : 1,
            borderRadius: 6,
            height: compact ? 26 : 30,
            background: 'var(--mantine-color-default)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
            outline: '1px solid var(--border-default)',
            ...style,
          }}
        >
          {disc ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: compact ? 3 : 5,
                  minWidth: 10,
                }}
              >
                {locatorFilters.slot && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--layer-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {locatorFilters.slot}
                  </div>
                )}
                {locatorFilters.set && (
                  <img
                    src={discDefIcon(locatorFilters.set as any)}
                    alt={locatorFilters.set}
                    style={{ height: compact ? 22 : 24 }}
                  />
                )}
              </div>
              <div style={compact ? { fontSize: 12 } : undefined}>
                {t('Location', {
                  rowIndex: Math.ceil(
                    (relicPositionIndex + 1) / inventoryWidth
                  ),
                  columnIndex: (relicPositionIndex % inventoryWidth) + 1,
                })}
              </div>
              <IconSettings size={compact ? 18 : 22} />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                paddingBottom: compact ? 0 : 2,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ width: compact ? 4 : 10 }} />
              <div style={compact ? { fontSize: 12 } : undefined}>
                {t('NoneSelected')}
              </div>
              <div style={{ width: compact ? 14 : 22 }} />
            </div>
          )}
        </div>
      </Popover.Target>
      <Popover.Dropdown>
        <div style={{ display: 'flex', gap: 8, minWidth: 260 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              {t('Width')}
            </div>
            <NumberInput
              defaultValue={inventoryWidth}
              style={{ width: 'auto' }}
              min={1}
              onChange={(val) =>
                setInventoryWidth(typeof val === 'number' ? val : 1)
              }
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              {t('Filter')}
            </div>
            <NumberInput
              defaultValue={rowLimit}
              style={{ width: 'auto' }}
              min={1}
              onChange={(val) => setRowLimit(typeof val === 'number' ? val : 1)}
            />
          </div>
        </div>
      </Popover.Dropdown>
    </Popover>
  )
}
