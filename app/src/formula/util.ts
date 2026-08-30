import type { Preset } from '@zenless-optimizer/game-opt/engine'
import { nonStackingQs } from '@zenless-optimizer/game-opt/engine'
import { cmpEq, cmpNE, reread } from '@zenless-optimizer/pando/engine'
import {
  type CharacterKey,
  type DiscMainStatKey,
  type DiscSetKey,
  type DiscSubStatKey,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  type MilestoneKey,
  type PhaseKey,
  type WengineKey,
} from '../consts'
import type { IDisc } from '../zood'
import type { Member, TagMapNodeEntries } from './data/util'
import {
  convert,
  getStatFromStatKey,
  own,
  ownBuff,
  ownTag,
  reader,
} from './data/util'

export function withPreset(
  preset: Preset,
  ...data: TagMapNodeEntries
): TagMapNodeEntries {
  return data.map(({ tag, value }) => ({ tag: { ...tag, preset }, value }))
}
export function withMember(
  src: Member,
  ...data: TagMapNodeEntries
): TagMapNodeEntries {
  return data.map(({ tag, value }) => ({ tag: { ...tag, src }, value }))
}

/**
 * Fields that define a character's talent/stat profile, used by
 * `charTagMapNodeEntries` to register character data into the calculator.
 */
export type CharBufferInput = {
  key: CharacterKey
  level: number
  promotion: number
  basic: number
  dodge: number
  special: number
  chain: number
  assist: number
  core: number
  mindscape: number
}

/**
 * Default values for a teammate when no roster data is available.
 * Kept in sync between UI display (CharCalcProvider) and optimizer
 * computation (buildStatsUtils).
 */
export const DEFAULT_TEAMMATE_CHAR = {
  level: 60,
  promotion: 5,
  basic: 11,
  dodge: 11,
  special: 11,
  chain: 11,
  assist: 11,
  core: 6,
  mindscape: 0,
} as const satisfies Omit<CharBufferInput, 'key'>

export function charTagMapNodeEntries(
  data: CharBufferInput
): TagMapNodeEntries {
  const {
    lvl,
    promotion,
    basic,
    dodge,
    special,
    chain,
    assist,
    core,
    mindscape,
  } = own.char
  const { char, iso, [data.key]: sheet } = reader.withAll('sheet', [])

  return [
    char.reread(sheet),
    iso.reread(sheet),

    lvl.add(data.level),
    basic.add(data.basic),
    dodge.add(data.dodge),
    special.add(data.special),
    chain.add(data.chain),
    assist.add(data.assist),
    core.add(data.core),
    promotion.add(data.promotion),
    mindscape.add(data.mindscape),

    // Default char
    ownBuff.base.crit_.add(0.05),
    ownBuff.base.crit_dmg_.add(0.5),
  ]
}

export function wengineTagMapNodeEntries(
  wengInfo:
    | {
        key: WengineKey
        level: number
        modification: MilestoneKey
        phase: PhaseKey
      }
    | undefined
): TagMapNodeEntries {
  return [
    // Mark wengine cones as used
    ...(wengInfo
      ? [
          own.common.count.sheet(wengInfo.key).add(1),
          own.wengine.lvl.add(wengInfo.level),
          own.wengine.modification.add(wengInfo.modification),
          own.wengine.phase.add(wengInfo.phase),
        ]
      : []),
  ]
}

export function discTagMapNodeEntries(
  stats: Partial<Record<DiscMainStatKey | DiscSubStatKey, number>>,
  sets: Partial<Record<DiscSetKey, number>>
): TagMapNodeEntries {
  const {
    common: { count },
    initial,
  } = convert(ownTag, { sheet: 'disc', et: 'own' })
  return [
    // Add `sheet:dyn` between the stat and the buff so that we can `detach` them easily
    // Used for disc main/sub stats, as those are fed into the builder at run-time, after nodes are optimized
    reader
      .withTag({ sheet: 'disc', qt: 'initial' })
      .reread(reader.sheet('dyn')),
    ...Object.entries(stats).map(([k, v]) =>
      getStatFromStatKey(initial, k).sheet('dyn').add(v)
    ),

    ...Object.entries(sets).map(([k, v]) =>
      count.sheet(k as DiscSetKey).add(v)
    ),
  ]
}

export function discsToTagMapNodeEntries(discs: IDisc[]): TagMapNodeEntries {
  const sets: Partial<Record<DiscSetKey, number>> = {},
    stats: Partial<Record<DiscMainStatKey | DiscSubStatKey, number>> = {}
  discs.forEach(({ setKey, mainStatKey, substats, level, rarity }) => {
    sets[setKey] = (sets[setKey] ?? 0) + 1
    stats[mainStatKey] =
      (stats[mainStatKey] ?? 0) + getDiscMainStatVal(rarity, mainStatKey, level)
    substats.forEach(({ key, upgrades }) => {
      if (!key || !upgrades) return
      stats[key] =
        (stats[key] ?? 0) + getDiscSubStatBaseVal(key, rarity) * upgrades
    })
  })
  return discTagMapNodeEntries(stats, sets)
}

export function teamData(members: readonly Member[]): TagMapNodeEntries {
  const teamEntry = reader.with('et', 'team')
  const { own, enemy, teamBuff, notOwnBuff } = reader
    .sheet('agg')
    .withAll('et', [])
  return [
    // Target Entries
    members.map((dst) =>
      reader
        .withTag({ et: 'target', dst })
        .reread(reader.withTag({ et: 'own', dst: null, src: dst }))
    ),
    // Team Buff
    members.flatMap((dst) => {
      const entry = own.with('src', dst)
      return members.map((src) =>
        entry.reread(teamBuff.withTag({ dst, src, name: null }))
      )
    }),
    // Not Self Buff
    members.flatMap((dst) => {
      const entry = own.with('src', dst)
      return members
        .filter((src) => src !== dst)
        .map((src) =>
          entry.reread(notOwnBuff.withTag({ dst, src, name: null }))
        )
    }),
    // Enemy Debuff
    members.map((src) =>
      enemy.reread(
        reader.withTag({ et: 'enemyDeBuff', dst: null, src, name: null })
      )
    ),
    // Non-stacking (addOnce) priority: stackTmp/stackOut per q per member
    members.flatMap((src, i) => {
      const own = reader.withTag({ src, et: 'own' })
      return [...nonStackingQs].flatMap((q) => {
        const ownQ = own.with('q', q)
        return [
          ownQ
            .with('qt', 'stackTmp')
            .add(cmpNE(ownQ.with('qt', 'stackIn'), 0, i + 1)),
          ownQ
            .with('qt', 'stackOut')
            .add(
              cmpEq(
                ownQ.with('qt', 'stackTmp').max.with('et', 'team'),
                i + 1,
                ownQ.with('qt', 'stackIn')
              )
            ),
        ]
      })
    }),

    // Total Team Stat
    members.map((src) => teamEntry.add(reader.withTag({ src, et: 'own' }))),
  ].flat()
}

/**
 * Bridge each teammate slot's final ATK, Sheer Force, and specialty into the
 * main character's `common`/`char` namespace via reread entries, enabling
 * formula sheets to read actual teammate stats (e.g., Dialyn's EX Special
 * additional damage that scales off a teammate's ATK or Sheer Force).
 *
 * Each slot (1, 2) registers four bridges:
 * - `teammate{N}_atk`        → teammate's `final.atk`
 * - `teammate{N}_sheerForce` → teammate's `final.sheerForce`
 * - `teammate{N}_specialty`  → teammate's `char.specialty`
 * - `teammate{N}_attribute`  → teammate's `char.attribute`
 */
export function teammateStatBridges(
  characterKey: CharacterKey,
  teammateKeys: readonly (CharacterKey | undefined)[]
): TagMapNodeEntries {
  const result: TagMapNodeEntries = []
  for (const slotIdx of [1, 2] as const) {
    // Use the teammate's key if present and different from self;
    // fall back to the main character's own stats so the calculator
    // always has a matching entry for the unique-accumulator reads.
    const key =
      teammateKeys[slotIdx] && teammateKeys[slotIdx] !== characterKey
        ? teammateKeys[slotIdx]!
        : characterKey

    result.push(
      // Bridge ATK
      {
        tag: {
          et: 'own',
          src: characterKey,
          dst: null,
          qt: 'common',
          q: `teammate${slotIdx}_atk`,
        } as any,
        value: reread({
          et: 'own',
          src: key,
          dst: null,
          qt: 'final',
          q: 'atk',
          sheet: 'agg',
        }),
      },
      // Bridge Sheer Force
      {
        tag: {
          et: 'own',
          src: characterKey,
          dst: null,
          qt: 'common',
          q: `teammate${slotIdx}_sheerForce`,
        } as any,
        value: reread({
          et: 'own',
          src: key,
          dst: null,
          qt: 'final',
          q: 'sheerForce',
          sheet: 'agg',
        }),
      },
      // Bridge Specialty
      {
        tag: {
          et: 'own',
          src: characterKey,
          dst: null,
          qt: 'char',
          q: `teammate${slotIdx}_specialty`,
        } as any,
        value: reread({
          et: 'own',
          src: key,
          dst: null,
          qt: 'char',
          q: 'specialty',
          sheet: 'agg',
        }),
      },
      // Bridge Attribute
      {
        tag: {
          et: 'own',
          src: characterKey,
          dst: null,
          qt: 'char',
          q: `teammate${slotIdx}_attribute`,
        } as any,
        value: reread({
          et: 'own',
          src: key,
          dst: null,
          qt: 'char',
          q: 'attribute',
          sheet: 'agg',
        }),
      }
    )
  }
  return result
}
