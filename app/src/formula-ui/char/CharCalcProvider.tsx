import { notEmpty, objKeyMap, toDecimal } from '@zenless-optimizer/common/util'
import type {
  CalcMeta,
  Calculator,
  Tag,
} from '@zenless-optimizer/game-opt/engine'
import { presets } from '@zenless-optimizer/game-opt/engine'
import { CalcContext } from '@zenless-optimizer/game-opt/formula-ui'
import type {
  FormulaText,
  FormulaTextFunc,
  FullTagDisplayComponent,
  TagDisplayComponent,
} from '@zenless-optimizer/game-opt/sheet-ui'
import {
  FormulaTextCacheContext,
  FormulaTextContext,
  FullTagDisplayContext,
  TagDisplayContext,
} from '@zenless-optimizer/game-opt/sheet-ui'
import type { CalcResult } from '@zenless-optimizer/pando/engine'
import { constant } from '@zenless-optimizer/pando/engine'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { CharacterKey, PhaseKey } from '../../consts'
import { allDiscSetKeys, allDiscSlotKeys, allWengineKeys } from '../../consts'
import type { DiscIds, ICachedCharacter, Team, TeamConditional } from '../../db'
import { getTeamFrame0, teamCharacterKeys } from '../../db'
import { useCharacter, useDiscs } from '../../db-ui'
import type { TagMapNodeEntries } from '../../formula'
import {
  charTagMapNodeEntries,
  conditionalEntries,
  DEFAULT_TEAMMATE_CHAR,
  discsToTagMapNodeEntries,
  discTagMapNodeEntries,
  enemy,
  own,
  ownBuff,
  reader,
  teamData,
  teammateStatBridges,
  wengineTagMapNodeEntries,
  withMember,
  withPreset,
  zzzCalculatorWithEntries,
} from '../../formula'
import { allStats } from '../../stats'
import { FullTagDisplay, TagDisplay } from '../components'
import { formulaText } from '../formulaText'

export function CharCalcProvider({
  character,
  team,
  discIds,
  children,
}: {
  character: ICachedCharacter
  team: Team
  discIds: DiscIds
  children: ReactNode
}) {
  const member0 = useCharacterAndEquipment(character, discIds)
  const teammate1Key = team.teammates[1]?.characterKey
  const teammate2Key = team.teammates[2]?.characterKey
  const teammate1Phase = team.teammates[1]?.wenginePhase
  const teammate2Phase = team.teammates[2]?.wenginePhase
  const teammate1Mindscape = team.teammates[1]?.mindscape
  const teammate2Mindscape = team.teammates[2]?.mindscape
  const teammate1Entries = useTeammateMemberEntries(
    teammate1Key,
    character.key,
    teammate1Phase,
    teammate1Mindscape
  )
  const teammate2Entries = useTeammateMemberEntries(
    teammate2Key,
    character.key,
    teammate2Phase,
    teammate2Mindscape
  )

  const calc = useMemo(() => {
    const frames = team.frames.length > 0 ? team.frames : [getTeamFrame0(team)]
    return zzzCalculatorWithEntries([
      ...teamData(teamCharacterKeys(team)),
      ...member0,
      ...teammate1Entries,
      ...teammate2Entries,
      ...teammateStatBridges(character.key, teamCharacterKeys(team)),
      enemy.common.lvl.add(team.enemyLvl),
      enemy.common.def.add(team.enemyDef),
      enemy.common.stun_.add(team.enemyStunMultiplier / 100),
      enemy.common.unstun_.add(1),
      ...frames.flatMap((frame, i) => {
        const preset = presets[i] ?? 'preset0'
        return [
          ...withPreset(preset, ownBuff.common.critMode.add(frame.critMode)),
          ...frame.conditionals.flatMap(
            ({ sheet, src, dst, condKey, condValue }) =>
              withPreset(
                preset,
                conditionalEntries(sheet, src, dst)(condKey, condValue)
              )
          ),
          ...frame.bonusStats
            .filter(({ disabled }) => !disabled)
            .flatMap(({ tag, value }) =>
              withPreset(preset, {
                // since bonusStats are applied to own*, needs {src:key, dst:never}
                tag: { ...tag, src: character.key, sheet: 'agg', et: 'own' },
                value: constant(toDecimal(value, tag.q ?? '')),
              })
            ),
          ...frame.enemyStats.flatMap(({ tag, value }) =>
            withPreset(preset, {
              tag: { ...tag, qt: 'common', et: 'enemy', sheet: 'agg' },
              value: constant(toDecimal(value, tag.q ?? '')),
            })
          ),
        ]
      }),
    ])
  }, [member0, teammate1Entries, teammate2Entries, team, character.key])
  // New map per calc so formula tooltips do not reuse stale nodes after gear/opt changes.
  const formulaTextCache = useMemo(() => calc && new Map(), [calc])

  return (
    <ZzzSheetUiProviders formulaTextCache={formulaTextCache}>
      <CalcContext.Provider value={calc as Calculator}>
        {children}
      </CalcContext.Provider>
    </ZzzSheetUiProviders>
  )
}

function ZzzSheetUiProviders({
  children,
  formulaTextCache,
}: {
  children: ReactNode
  formulaTextCache: Map<CalcResult<number, CalcMeta<Tag, never>>, FormulaText>
}) {
  return (
    <FormulaTextCacheContext.Provider value={formulaTextCache}>
      <FormulaTextContext.Provider value={formulaText as FormulaTextFunc}>
        <TagDisplayContext.Provider value={TagDisplay as TagDisplayComponent}>
          <FullTagDisplayContext.Provider
            value={FullTagDisplay as FullTagDisplayComponent}
          >
            {children}
          </FullTagDisplayContext.Provider>
        </TagDisplayContext.Provider>
      </FormulaTextContext.Provider>
    </FormulaTextCacheContext.Provider>
  )
}

function useCharacterAndEquipment(
  character: ICachedCharacter | undefined,
  discIds: DiscIds
) {
  const discs = useDiscs(discIds)
  const wengineTagEntries = useMemo(
    () =>
      wengineTagMapNodeEntries(
        character?.wengineKey
          ? {
              key: character.wengineKey,
              level: 60,
              modification: 5,
              phase: character.wenginePhase as PhaseKey,
            }
          : undefined
      ),
    [character?.wengineKey, character?.wenginePhase]
  )
  const discTagEntries = useMemo(
    () => discsToTagMapNodeEntries(Object.values(discs).filter(notEmpty)),
    [discs]
  )
  return useMemo(
    () =>
      character
        ? memberAndEquipmentEntries(
            character,
            wengineTagEntries,
            discTagEntries
          )
        : [],
    [character, wengineTagEntries, discTagEntries]
  )
}

function useTeammateMemberEntries(
  teammateKey: CharacterKey | undefined,
  mainCharacterKey: CharacterKey,
  wenginePhaseOverride?: number,
  mindscapeOverride?: number
) {
  const character = useCharacter(teammateKey)
  const discs = useDiscs(character?.equippedDiscs)
  const phase = (wenginePhaseOverride ??
    character?.wenginePhase ??
    1) as PhaseKey
  const wengineTagEntries = useMemo(
    () =>
      wengineTagMapNodeEntries(
        character?.wengineKey
          ? {
              key: character.wengineKey,
              level: 60,
              modification: 5,
              phase,
            }
          : undefined
      ),
    [character?.wengineKey, phase]
  )
  const discTagEntries = useMemo(
    () => discsToTagMapNodeEntries(Object.values(discs).filter(notEmpty)),
    [discs]
  )
  return useMemo(() => {
    if (!teammateKey || teammateKey === mainCharacterKey) return []

    // When the teammate character hasn't been added to the database yet,
    // provide default entries so the calculator has their base data
    // (mindscape, level, skill tiers, iso.reread bridge, etc.).
    // Without this, any formula referencing the teammate's char properties
    // (e.g. `char.mindscape`) would fail with an "Ill-form read" error
    // because zero matching entries exist for the `unique` accumulator.
    const char: ICachedCharacter = character ?? {
      key: teammateKey,
      ...DEFAULT_TEAMMATE_CHAR,
      wengineKey: '',
      wenginePhase: 1,
      equippedDiscs: objKeyMap(allDiscSlotKeys, () => ''),
    }
    // Apply mindscape override: if the user set a team-level mindscape
    // (via the teammate card UI), use that instead of the roster mindscape.
    const effectiveChar =
      mindscapeOverride !== undefined
        ? { ...char, mindscape: mindscapeOverride }
        : char
    return memberAndEquipmentEntries(
      effectiveChar,
      wengineTagEntries,
      discTagEntries
    )
  }, [
    character,
    teammateKey,
    mainCharacterKey,
    wengineTagEntries,
    discTagEntries,
    mindscapeOverride,
  ])
}

function memberAndEquipmentEntries(
  character: ICachedCharacter,
  wengineTagEntries: TagMapNodeEntries,
  discTagEntries: TagMapNodeEntries
): TagMapNodeEntries {
  return withMember(
    character.key,
    ...charTagMapNodeEntries(character),
    ...wengineTagEntries,
    ...discTagEntries,
    // Count entries for team aggregate
    ownBuff.common.count
      .withSpecialty(allStats.char[character.key].specialty)
      .add(1),
    ownBuff.common.count
      .withFaction(allStats.char[character.key].faction)
      .add(1),
    ownBuff.common.count
      .withTag({ attribute: allStats.char[character.key].attribute })
      .add(1)
  )
}

/**
 * A minimal Provider with all the disc sets and wengine count mocked
 */
export function CharCalcMockCountProvider({
  character,
  conditionals,
  children,
}: {
  character: ICachedCharacter
  conditionals: readonly TeamConditional[]
  children: ReactNode
}) {
  const calc = useMemo(
    () =>
      zzzCalculatorWithEntries([
        // Specify members present in the team
        ...teamData([character.key]),
        ...teammateStatBridges(character.key, [character.key]),
        // Add actual member data
        ...withMember(
          character.key,
          ...charTagMapNodeEntries(character),
          ...discTagMapNodeEntries(
            {},
            objKeyMap(allDiscSetKeys, () => 4)
          ),
          // mock wengine
          // Opt-in for wengine buffs, instead of enabling it by default to reduce `read` traffic
          reader.sheet('agg').reread(reader.sheet('wengine')),
          own.wengine.lvl.add(60),
          own.wengine.modification.add(5),
          own.wengine.phase.add(1),
          ...allWengineKeys.map((key) => own.common.count.sheet(key).add(1)),
          // Count entries for team aggregate
          ownBuff.common.count
            .withSpecialty(allStats.char[character.key].specialty)
            .add(1),
          ownBuff.common.count
            .withFaction(allStats.char[character.key].faction)
            .add(1),
          ownBuff.common.count
            .withTag({ attribute: allStats.char[character.key].attribute })
            .add(1)
        ),
        // TODO: Get enemy values from db
        ownBuff.common.critMode.add('avg'),
        enemy.common.lvl.add(100),
        enemy.common.def.add(900),
        enemy.common.stun_.add(1.5),
        enemy.common.unstun_.add(1),
        ...conditionals.flatMap(({ sheet, src, dst, condKey, condValue }) =>
          withPreset(
            `preset0`,
            conditionalEntries(sheet, src, dst)(condKey, condValue)
          )
        ),
      ]),
    [character, conditionals]
  )

  const formulaTextCache = useMemo(() => calc && new Map(), [calc])

  return (
    <ZzzSheetUiProviders formulaTextCache={formulaTextCache}>
      <CalcContext.Provider value={calc as Calculator}>
        {children}
      </CalcContext.Provider>
    </ZzzSheetUiProviders>
  )
}
