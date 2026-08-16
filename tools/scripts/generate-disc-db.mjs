// Generates a ZOOD-format database JSON for the Zenless Optimizer app
// (upload via Settings > Database > Upload).
//
// Contents:
//   - Level 15, S-rank discs (4 substats, 9 total rolls: 4 base + 5 upgrades)
//   - Slots 1-3: main stat fixed (hp / atk / def)
//   - Slot 4: main stats limited to ATK% (atk_) and Anomaly Proficiency (anomProf)
//   - Slot 5: main stats limited to ATK% (atk_) and PEN Ratio (pen_)
//   - Slot 6: main stat limited to ATK% (atk_)
//   - Substats are restricted to the preferred pool [atk%, flat ATK, AP, PEN].
//     When the main stat is one of those (it cannot also appear as a substat),
//     the 4th substat slot is filled from a small fallback set.
//   - Per substat combination, ALL roll distributions (every composition
//     of 9 into 4 positive parts, each 1..6) incl. hyper-focused 1/1/1/6.
//   - Slots 1-4 use FeatheredFate, slots 5-6 use ChaosJazz
//
// The stat key names mirror app/src/consts/disc.ts so the output
// is guaranteed to match what the app's schema accepts. The preferred
// substats, fallbacks, and narrowed mains are custom subsets of those keys.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'feathered-fate-chaos-jazz-discs.json'
)

// ---- constants (mirrors app/src/consts/disc.ts) ----
// Narrowed main stats per user request:
//   slot 4: only ATK% and Anomaly Proficiency
//   slot 5: only ATK% and PEN Ratio
//   slot 6: only ATK%
const discSlotToMainStatKeys = {
  1: ['hp'],
  2: ['atk'],
  3: ['def'],
  4: ['atk_', 'anomProf'],
  5: ['atk_', 'pen_'],
  6: ['atk_'],
}
const slotToSet = {
  1: 'FeatheredFate',
  2: 'FeatheredFate',
  3: 'FeatheredFate',
  4: 'FeatheredFate',
  5: 'ChaosJazz',
  6: 'ChaosJazz',
}

// Preferred substats per user request: ATK%, flat ATK, AP, PEN.
const PREFERRED_SUBSTATS = ['atk_', 'atk', 'anomProf', 'pen']
// Fallback substats used only when the main stat is one of the preferred
// keys (and therefore can't appear as a substat), so the disc still has
// 4 substats. A small set keeps a bit of variety.
const FALLBACK_SUBSTATS = ['crit_', 'crit_dmg_', 'def_', 'hp_']

const LEVEL = 15
const RARITY = 'S'
// Total substat rolls per disc: 4 base rolls + 5 upgrade rolls
const TOTAL_ROLLS = 9

// ALL roll distributions: every composition of 9 into 4 positive parts
// (each part in 1..6, per the app's substat upgrade bound of 6). There are
// 56 of them, covering the even split [3,2,2,2], hyper-focused 1/1/1/6,
// and everything in between. The DB is small, so this stays comfortably
// within the app's localStorage budget.
const ROLL_DISTRIBUTIONS = (() => {
  const dists = []
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++) {
        const d = TOTAL_ROLLS - a - b - c
        if (d >= 1 && d <= 6) dists.push([a, b, c, d])
      }
  return dists
})()

/**
 * Build the 4-substat combos allowed for a given main stat key.
 * Uses the preferred pool; if the main stat blocks one preferred key,
 * fills the 4th slot from the fallback set.
 */
function substatCombosFor(mainStatKey) {
  const available = PREFERRED_SUBSTATS.filter((k) => k !== mainStatKey)
  if (available.length === 4) {
    return [available]
  }
  // Main stat ate one preferred slot: fill 4th from fallbacks
  return FALLBACK_SUBSTATS.map((f) => [...available, f])
}

const discs = []

for (const slotKey of Object.keys(discSlotToMainStatKeys)) {
  const setKey = slotToSet[slotKey]
  for (const mainStatKey of discSlotToMainStatKeys[slotKey]) {
    for (const combo of substatCombosFor(mainStatKey)) {
      for (const distribution of ROLL_DISTRIBUTIONS) {
        const distTag = distribution.join('')
        discs.push({
          id: `${setKey}_${slotKey}_${mainStatKey}_${combo.join('+')}_${distTag}`,
          setKey,
          slotKey,
          level: LEVEL,
          rarity: RARITY,
          mainStatKey,
          substats: combo.map((key, i) => ({
            key,
            upgrades: distribution[i],
          })),
          location: '',
          lock: false,
          trash: false,
        })
      }
    }
  }
}

const zood = {
  format: 'ZOOD',
  version: 1,
  dbVersion: 3,
  // IMPORTANT: must equal the app's zzzSource ('Zenless Optimizer') or the
  // importer strips the `id` field from every disc and skips them all.
  source: 'Zenless Optimizer',
  discs,
}

// ---- self-validation ----
const perSlot = {}
for (const disc of discs) {
  perSlot[disc.slotKey] = (perSlot[disc.slotKey] ?? 0) + 1
  const sumRolls = disc.substats.reduce((s, sub) => s + sub.upgrades, 0)
  if (sumRolls !== TOTAL_ROLLS) {
    throw new Error(
      `Disc ${disc.id} has ${sumRolls} rolls, expected ${TOTAL_ROLLS}`
    )
  }
  if (disc.substats.length !== 4) {
    throw new Error(
      `Disc ${disc.id} has ${disc.substats.length} substats, expected 4`
    )
  }
  const keys = disc.substats.map((s) => s.key)
  if (new Set(keys).size !== 4) {
    throw new Error(`Disc ${disc.id} has duplicate substats`)
  }
  if (keys.includes(disc.mainStatKey)) {
    throw new Error(
      `Disc ${disc.id} has substat equal to main stat ${disc.mainStatKey}`
    )
  }
  if (!discSlotToMainStatKeys[disc.slotKey].includes(disc.mainStatKey)) {
    throw new Error(
      `Disc ${disc.id} has invalid main stat for slot ${disc.slotKey}`
    )
  }
  if (!['FeatheredFate', 'ChaosJazz'].includes(disc.setKey)) {
    throw new Error(`Disc ${disc.id} has unexpected set ${disc.setKey}`)
  }
  const preferredBlocked = PREFERRED_SUBSTATS.includes(disc.mainStatKey)
  const fallbackKeys = keys.filter((k) => !PREFERRED_SUBSTATS.includes(k))
  if (preferredBlocked && fallbackKeys.length !== 1) {
    throw new Error(
      `Disc ${disc.id} should have exactly 1 fallback substat, got ${fallbackKeys.length}`
    )
  }
  if (!preferredBlocked && fallbackKeys.length !== 0) {
    throw new Error(
      `Disc ${disc.id} should have no fallback substats, got ${fallbackKeys.join(',')}`
    )
  }
  if (fallbackKeys.some((k) => !FALLBACK_SUBSTATS.includes(k))) {
    throw new Error(
      `Disc ${disc.id} has invalid fallback substat ${fallbackKeys.join(',')}`
    )
  }
  const upgrades = disc.substats.map((s) => s.upgrades)
  const distOk = ROLL_DISTRIBUTIONS.some((d) =>
    d.every((v, i) => v === upgrades[i])
  )
  if (!distOk) {
    throw new Error(`Disc ${disc.id} has unlisted distribution [${upgrades}]`)
  }
}
const ids = new Set(discs.map((d) => d.id))
if (ids.size !== discs.length) {
  throw new Error(`Duplicate disc ids: ${discs.length - ids.size}`)
}

// Compact JSON: the upload UI renders the whole file in a textarea, so keep
// it small.
writeFileSync(OUT_FILE, JSON.stringify(zood))
console.log(`Wrote ${discs.length} discs to ${OUT_FILE}`)
console.log('Per-slot counts:', perSlot)
console.log(
  'File size (compact):',
  (JSON.stringify(zood).length / 1024 / 1024).toFixed(2),
  'MB'
)
console.log('Distributions per combo:', ROLL_DISTRIBUTIONS.length)
