import { toDecimal } from '@zenless-optimizer/common/util'
import type { Preset } from '@zenless-optimizer/game-opt/engine'
import type { Candidate, Progress } from '@zenless-optimizer/game-opt/solver'

import {
  cmpGE,
  constant,
  detach,
  max,
  prod,
  read,
  sum,
} from '@zenless-optimizer/pando/engine'
import type {
  CharacterKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
  PhaseKey,
  WengineKey,
} from '../consts'
import {
  allDiscSetKeys,
  allWengineKeys,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
} from '../consts'
import type { StatFilter } from '../db'
import { type ICachedDisc, StatFilterTagToTag } from '../db'
import { type Calculator, Read, type Tag } from '../formula'

const EPSILON = 1e-7

type Frames = Array<{ tag: Tag; multiplier: number }>

export {
  type BuildRecipe,
  generateTheoreticalDiscs,
} from './generateTheoreticalDiscs'

export function createSolverConfig(
  characterKey: CharacterKey,
  calc: Calculator,
  frames: Frames,
  statFilters: Array<Omit<StatFilter, 'disabled'>>,
  setFilter2: DiscSetKey[],
  setFilter4: DiscSetKey[],
  wengineKeys: WengineKey[],
  wenginePhase: PhaseKey,
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>,
  numWorkers: number,
  numOfBuilds: number,
  setProgress: (progress: Progress) => void,
  /**
   * When provided, use aggregated recipe candidates instead of per-slot
   * disc candidates. Recipes contain ALL stats combined (main stats for
   * all 6 slots + total substat values + set counters) in a single flat
   * Candidate object per recipe. Slots 2-6 get empty dummies since all
   * stats are already in slot 1's recipe.
   */
  recipeCandidates?: Candidate<string>[]
) {
  const discSetKeys = new Set(allDiscSetKeys)
  const allWengineKeySet = new Set(allWengineKeys)
  const undetachedNodes = [
    // optimization target
    sum(
      ...frames.map((frame, i) =>
        prod(
          frame.multiplier,
          new Read(
            {
              src: characterKey,
              ...frame.tag,
            },
            undefined // undefined as 'infer'
          ).with('preset', `preset${i}` as Preset)
        )
      )
    ),
    // stat filters
    ...statFilters.map(({ tag, isMax }) => {
      // only apply src as tag for stat constraint
      const newTag: Tag = {
        ...StatFilterTagToTag(tag),
        src: characterKey,
        preset: `preset0`,
      }
      // Invert max constraints for pruning, undefined as 'infer'
      return isMax
        ? prod(-1, new Read(newTag, undefined))
        : new Read(newTag, undefined)
    }),
    // CR overcap constraint: prevent solver from allocating substat rolls
    // to CR above 100%. Final crit rate includes base, w-engine, abilities,
    // disc main stat, and disc substats. Any CR beyond 100% contributes
    // nothing to damage (formula caps via `cappedCrit_`), so the solver
    // must not waste rolls on it.
    // Only applies in theoretical max mode (recipeCandidates) where the
    // solver freely allocates rolls across substats; in normal mode, discs
    // have fixed substats and the formula's cappedCrit_ already handles it.
    ...(recipeCandidates
      ? [
          prod(
            -1,
            new Read(
              {
                src: characterKey,
                q: 'crit_',
                qt: 'final',
                et: 'own',
                sheet: 'agg',
                preset: 'preset0' as Preset,
              },
              undefined
            )
          ),
        ]
      : []),
    // other calcs (graph, etc) *go in* `nodes.push` below
  ]

  // converts game-specific calc into a more general representation usable by solver.
  // This will be reused across any number of builds
  const nodes = detach(undetachedNodes, calc, (tag: Tag) => {
    // Removes disc and wengine nodes from the opt character, while retaining data from the rest of the team.
    if (tag['src'] !== characterKey) return undefined // Wrong member
    if (tag['et'] !== 'own') return undefined // Not applied (only) to self

    // dyn is added as a layer in `discTagMapNodeEntries`
    // only `initial` stats are in main/subs of discs.
    if (tag['sheet'] === 'dyn' && tag['qt'] === 'initial')
      if (tag.q === 'dmg_') return { q: `${tag.attribute}_dmg_` }
      else return { q: tag['q']! } // Disc stat bonus

    // Disc set counter
    if (tag['q'] === 'count' && discSetKeys.has(tag['sheet'] as any))
      return { q: tag['sheet']! }

    // wengine bonus
    if (
      tag['qt'] === 'wengine' &&
      ['lvl', 'phase', 'modification'].includes(tag['q'] as string)
    )
      return { q: tag['q']! }

    // wengine counter
    if (tag['q'] === 'count' && allWengineKeySet.has(tag['sheet'] as any))
      return { q: tag['sheet']! }

    return undefined
  })

  // Whether both filter types are active (user selected both 2p and 4p sets)
  const bothFiltersActive = !!setFilter2.length && !!setFilter4.length
  // Union of all sets selected across both filters
  const allSelectedSets = [...new Set([...setFilter2, ...setFilter4])]
  // Sets exclusive to the 2p filter (present only in setFilter2, not setFilter4)
  const exclusive2p = setFilter2.filter((q) => !setFilter4.includes(q))

  nodes.push(
    // filter2: if not empty, at least one >= 2
    setFilter2.length
      ? max(...setFilter2.map((q) => read({ q }, 'sum')))
      : constant(Infinity),
    // filter4: if not empty, at least one >= 4
    setFilter4.length
      ? max(...setFilter4.map((q) => read({ q }, 'sum')))
      : constant(Infinity),
    // When both 2p and 4p filters are active, ensure every disc comes from
    // one of the user's chosen sets. Without this, the solver can satisfy
    // both >=2 and >=4 using just 4 discs of the 4p set, leaving 2 random
    // unselected discs that contribute nothing to any bonus.
    // When only one filter type is active, random filler discs are allowed.
    bothFiltersActive && allSelectedSets.length
      ? sum(...allSelectedSets.map((q) => read({ q }, 'sum')))
      : constant(Infinity),
    // When both filters are active and there are exclusive 2p sets, prevent
    // distributions like 5+1 (5 of 4p set + 1 of a 2p set) where neither
    // fills a meaningful bonus. Either at least one 4p set fills all 6 slots
    // (all-same-set build), or at least one exclusive 2p set has >= 2 discs.
    bothFiltersActive && exclusive2p.length
      ? cmpGE(
          max(...setFilter4.map((q) => read({ q }, 'sum'))),
          6,
          2,
          max(...exclusive2p.map((q) => read({ q }, 'sum')))
        )
      : constant(Infinity)
    // other calcs (graph, etc)
  )

  return {
    nodes,
    candidates: recipeCandidates
      ? [
          wengineKeys.map((key) => wengineCandidate(key, wenginePhase)),
          recipeCandidates, // all stats combined in one candidate per recipe
          [{ id: 'empty_2' as any, __empty: 0 }],
          [{ id: 'empty_3' as any, __empty: 0 }],
          [{ id: 'empty_4' as any, __empty: 0 }],
          [{ id: 'empty_5' as any, __empty: 0 }],
          [{ id: 'empty_6' as any, __empty: 0 }],
        ]
      : [
          wengineKeys.map((key) => wengineCandidate(key, wenginePhase)),
          discsBySlot['1'].map(discCandidate),
          discsBySlot['2'].map(discCandidate),
          discsBySlot['3'].map(discCandidate),
          discsBySlot['4'].map(discCandidate),
          discsBySlot['5'].map(discCandidate),
          discsBySlot['6'].map(discCandidate),
        ],
    minimum: [
      -Infinity, // opt-target itself is also used as a min constraint
      // Invert max constraints for pruning
      ...statFilters.map(({ value, isMax, tag }) => {
        const decimalVal = toDecimal(value, tag.q ?? '')
        return (isMax ? decimalVal * -1 : decimalVal) - EPSILON
      }),
      // CR overcap constraint minimum (finalCrit <= 1.0):
      // inverted max constraint: -finalCrit >= -1 - EPSILON === finalCrit <= 1 + EPSILON
      ...(recipeCandidates ? [-1 - EPSILON] : []),
      2, // setFilter2
      4, // setFilter4
      bothFiltersActive && allSelectedSets.length ? 6 : Infinity, // all selected sets fill 6 slots
      bothFiltersActive && exclusive2p.length ? 2 : Infinity, // prevent 5+1 splits
    ],
    numWorkers,
    // Use a minimum internal topN of 100 for pruning, even if the user
    // requests fewer results. Lower topN causes the solver to prune
    // aggressively during optimization, which can eliminate candidates
    // that would lead to the globally best build. A higher internal topN
    // keeps more candidates alive; the caller slices to the user's count.
    topN: Math.max(numOfBuilds, 100),
    setProgress,
  }
}

function discCandidate(disc: ICachedDisc): Candidate<string> {
  const { id, mainStatKey, level, rarity, setKey, substats } = disc
  return {
    id: id as any,
    [mainStatKey]: getDiscMainStatVal(rarity, mainStatKey, level),
    ...Object.fromEntries(
      substats
        .filter(
          (sub): sub is typeof sub & { key: DiscSubStatKey } =>
            !!sub.key && !!sub.upgrades
        )
        .map(({ key, upgrades }) => [
          key,
          getDiscSubStatBaseVal(key, rarity) * upgrades,
        ])
    ),
    [setKey]: 1,
  }
}

function wengineCandidate(key: WengineKey, phase: PhaseKey): Candidate<string> {
  return {
    id: key as any,
    lvl: 60,
    modification: 5,
    phase,
    [key]: 1,
  }
}
