import type {
  DiscMainStatKey,
  DiscRarityKey,
  DiscSlotKey,
  DiscSubStatKey,
  LocationKey,
} from '../../../consts'
import {
  allDiscSetKeys,
  allDiscSlotKeys,
  discMaxLevel,
  discSlotToMainStatKeys,
  discSubstatRollData,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '../../../consts'
import type { IDisc } from '../../../zood'
import type {
  DiscEditorConfig,
  DiscEditorForm,
  SubstatUpgradeValues,
} from './discEditorModalTypes'

export function computeInitialFormValues(
  config: DiscEditorConfig
): DiscEditorForm {
  const { selectedDisc, slotKey, characterKey } = config

  if (selectedDisc) {
    const substats = selectedDisc.substats ?? []
    return {
      setKey: selectedDisc.setKey,
      slotKey: selectedDisc.slotKey,
      rarity: selectedDisc.rarity,
      level: selectedDisc.level,
      mainStatKey: selectedDisc.mainStatKey,
      substatKey0: (substats[0]?.key as DiscSubStatKey) ?? '',
      substatKey1: (substats[1]?.key as DiscSubStatKey) ?? '',
      substatKey2: (substats[2]?.key as DiscSubStatKey) ?? '',
      substatKey3: (substats[3]?.key as DiscSubStatKey) ?? '',
      substatUpgrade0: substats[0]?.upgrades ?? 0,
      substatUpgrade1: substats[1]?.upgrades ?? 0,
      substatUpgrade2: substats[2]?.upgrades ?? 0,
      substatUpgrade3: substats[3]?.upgrades ?? 0,
      location: (selectedDisc.location as LocationKey) ?? '',
      lock: selectedDisc.lock ?? false,
    }
  }

  const defaultSlot = slotKey ?? '1'
  const defaultMainStats = discSlotToMainStatKeys[defaultSlot]
  const defaultMainStat = defaultMainStats[0] as DiscMainStatKey

  return {
    setKey: allDiscSetKeys[0],
    slotKey: defaultSlot,
    rarity: 'S',
    level: 0,
    mainStatKey: defaultMainStat,
    substatKey0: '',
    substatKey1: '',
    substatKey2: '',
    substatKey3: '',
    substatUpgrade0: 0,
    substatUpgrade1: 0,
    substatUpgrade2: 0,
    substatUpgrade3: 0,
    location: (characterKey as LocationKey) ?? '',
    lock: false,
  }
}

export function computeMainStatOptions(
  slotKey: DiscSlotKey | undefined
): { label: string; value: DiscMainStatKey }[] {
  if (!slotKey) return []
  return discSlotToMainStatKeys[slotKey].map((stat) => ({
    label: statKeyTextMap[stat] ?? stat,
    value: stat,
  }))
}

export function computeMainStatValue(
  rarity: DiscRarityKey | undefined,
  mainStatKey: DiscMainStatKey | undefined,
  level: number | undefined
): number | undefined {
  if (!rarity || !mainStatKey || level == null) return undefined
  return getDiscMainStatVal(rarity, mainStatKey, level)
}

export function calculateUpgradeValues(
  form: DiscEditorForm
): SubstatUpgradeValues[] {
  const pairs = [
    { key: form.substatKey0, upgrades: form.substatUpgrade0 },
    { key: form.substatKey1, upgrades: form.substatUpgrade1 },
    { key: form.substatKey2, upgrades: form.substatUpgrade2 },
    { key: form.substatKey3, upgrades: form.substatUpgrade3 },
  ]

  return pairs.map(({ key }) => {
    if (!key) {
      return { upgrades: [], totals: [] }
    }

    const baseVal = getDiscSubStatBaseVal(key as DiscSubStatKey, form.rarity)
    const { numUpgrades } = discSubstatRollData[form.rarity]
    const upgrades = Array.from({ length: numUpgrades + 1 }, (_, i) => i + 1)
    const totals = upgrades.map((u) => baseVal * u)

    return { upgrades, totals }
  })
}

function isPercentageStat(stat: string): boolean {
  return stat.endsWith('_')
}

function formatStatValue(stat: string, value: number): string {
  if (isPercentageStat(stat)) {
    return `${(value * 100).toFixed(1)}%`
  }
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export { formatStatValue }

export function validateDiscEditor(form: DiscEditorForm): IDisc | string[] {
  const errors: string[] = []

  if (!form.setKey) errors.push('Disc set is required')
  if (!form.slotKey) errors.push('Slot is required')
  if (!form.rarity) errors.push('Rarity is required')
  if (!form.mainStatKey) errors.push('Main stat is required')

  const maxLevel = discMaxLevel[form.rarity]
  if (form.level < 0 || form.level > maxLevel) {
    errors.push(`Level must be between 0 and ${maxLevel}`)
  }

  const allowedMains = discSlotToMainStatKeys[form.slotKey]
  if (!allowedMains.includes(form.mainStatKey)) {
    errors.push(
      `Main stat ${form.mainStatKey} is not valid for slot ${form.slotKey}`
    )
  }

  const substatKeys = [
    form.substatKey0,
    form.substatKey1,
    form.substatKey2,
    form.substatKey3,
  ]
  const substatUpgrades = [
    form.substatUpgrade0,
    form.substatUpgrade1,
    form.substatUpgrade2,
    form.substatUpgrade3,
  ]

  const filledKeys = substatKeys.filter((k) => k !== '')

  const minSubstats = form.rarity === 'S' ? 3 : 2
  if (filledKeys.length < minSubstats) {
    errors.push(
      `${form.rarity}-rank discs require at least ${minSubstats} substats`
    )
  }

  if (new Set(filledKeys).size !== filledKeys.length && filledKeys.length > 1) {
    errors.push('Duplicate substats are not allowed')
  }

  if (filledKeys.includes(form.mainStatKey as DiscSubStatKey)) {
    errors.push('Substat cannot be the same as the main stat')
  }

  const totalUpgrades = substatUpgrades.reduce((sum, u) => sum + u, 0)
  const { low, high } = discSubstatRollData[form.rarity]
  const lowerBound = low + Math.floor(form.level / 3)
  const upperBound = high + Math.floor(form.level / 3)

  if (filledKeys.length >= minSubstats) {
    if (totalUpgrades > upperBound) {
      errors.push(
        `${form.rarity}-rank disc (level ${form.level}) should have no more than ${upperBound} upgrades. Currently has ${totalUpgrades}.`
      )
    } else if (totalUpgrades < lowerBound) {
      errors.push(
        `${form.rarity}-rank disc (level ${form.level}) should have at least ${lowerBound} upgrades. Currently has ${totalUpgrades}.`
      )
    }
  }

  if (errors.length > 0) return errors

  const substats = substatKeys
    .filter((key): key is DiscSubStatKey => key !== '' && key != null)
    .map((key, i) => ({
      key,
      upgrades: substatUpgrades[i],
    }))
    .filter((s) => s.upgrades > 0)

  const disc: IDisc = {
    setKey: form.setKey,
    slotKey: form.slotKey,
    rarity: form.rarity,
    level: form.level,
    mainStatKey: form.mainStatKey,
    substats,
    location: form.location,
    lock: form.lock,
    trash: false,
  }

  return disc
}

export const ENHANCE_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: String(i),
  label: `+${i}`,
}))

export const RARITY_OPTIONS = [
  { value: 'S', label: 'S' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
]

export { allDiscSlotKeys }
