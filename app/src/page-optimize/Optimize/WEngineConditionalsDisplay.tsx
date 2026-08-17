import { Box, Flex, HoverCard, Select, Switch, Text } from '@mantine/core'

import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type {
  Field,
  Header,
  TagField,
} from '@zenless-optimizer/game-opt/sheet-ui'
import { TagFieldDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { memo, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey, WengineKey } from '../../consts'
import { useCharacterContext, useDatabaseContext, useTeam } from '../../db-ui'
import { buffs as allBuffs, conditionals, own } from '../../formula'
import {
  TagDisplay,
  useZzzCalcContext,
  wengineUiSheets,
} from '../../formula-ui'
import { buffAppliesToMainUnit } from '../../formula-ui/teammate'
import { GameDesc, GameText } from '../../i18n'
import { getCharStat } from '../../stats'
import { HeaderText } from '../layout'
import {
  ConditionalText,
  conditionalAlign,
  conditionalJustify,
  condLabel,
  NumConditionalRow,
} from './conditionalUtils'

/**
 * Creates a description component that renders only the first sentence of a
 * wengine's phase description (everything up to the first ". ").
 */
function firstSentenceDesc(ns: string) {
  return function Desc({ phase }: { phase: number }) {
    const { t } = useTranslation(ns)
    const fullDesc = t(`${ns}:phaseDescs.${phase - 1}`)
    const idx = fullDesc.indexOf('. ')
    if (idx === -1) return <GameText text={fullDesc} />
    return <GameText text={fullDesc.slice(0, idx + 1)} />
  }
}

/**
 * Creates a description component that renders a wengine's phase description
 * starting at the given marker text (e.g. "When "), or the full description
 * if the marker isn't present.
 */
function fromMarkerDesc(ns: string, marker: string) {
  return function Desc({ phase }: { phase: number }) {
    const { t } = useTranslation(ns)
    const fullDesc = t(`${ns}:phaseDescs.${phase - 1}`)
    const idx = fullDesc.indexOf(marker)
    if (idx === -1) return <GameText text={fullDesc} />
    return <GameText text={fullDesc.slice(idx)} />
  }
}

/** Energy Regen portion of HalfSugarBunny's phase description (first sentence). */
const HalfSugarBunnyERDesc = firstSentenceDesc('wengine_HalfSugarBunny_gen')

/** Squad ATK/HP portion of HalfSugarBunny's phase description (second and third sentences). */
function HalfSugarBunnySquadDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_HalfSugarBunny_gen')
  const fullDesc = t(`wengine_HalfSugarBunny_gen:phaseDescs.${phase - 1}`)
  const whenIdx = fullDesc.indexOf('When ')
  if (whenIdx === -1) return <GameText text={fullDesc} />
  // Skip the first sentence
  const afterFirstDot = fullDesc.indexOf('. ') + 2
  return <GameText text={fullDesc.slice(afterFirstDot, whenIdx)} />
}

/** Conditional portion of HalfSugarBunny's phase description (from "When" onward). */
const HalfSugarBunnyCondDesc = fromMarkerDesc(
  'wengine_HalfSugarBunny_gen',
  'When '
)

/**
 * Loads the full SolExuvia phase description and renders only the Eclipse
 * portion, stripping the "CRIT Rate increases by 20%. " prefix.
 */
function SolExuviaEclipseDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_SolExuvia_gen')
  const fullDesc = t(`wengine_SolExuvia_gen:phaseDescs.${phase - 1}`)
  const eclipseDesc = fullDesc.replace(/^CRIT Rate increases by 20%\.\s*/, '')
  return <GameText text={eclipseDesc} />
}

/** Self Anomaly Proficiency portion of JoyauDore's phase description (first sentence). */
function JoyauDoreSelfAnomDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_JoyauDore_gen')
  const fullDesc = t(`wengine_JoyauDore_gen:phaseDescs.${phase - 1}`)
  const selfDesc = fullDesc.match(/^[^.]+\./)?.[0] ?? fullDesc
  return <GameText text={selfDesc} />
}

/** Conditional portion of JoyauDore's phase description (from "When" to end). */
const JoyauDoreCondDesc = fromMarkerDesc('wengine_JoyauDore_gen', 'When ')

/** Squad Anomaly Proficiency portion of JoyauDore's phase description ("At 2 stacks…" to end). */
function JoyauDoreSquadAnomDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_JoyauDore_gen')
  const fullDesc = t(`wengine_JoyauDore_gen:phaseDescs.${phase - 1}`)
  const squadDesc = fullDesc.match(/At 2 stacks[^]*/)?.[0] ?? fullDesc
  return <GameText text={squadDesc} />
}

/** Impact + Fire RES portion of ChiefSidekick's phase description (first sentence). */
const ChiefSidekickImpactResDesc = firstSentenceDesc(
  'wengine_ChiefSidekick_gen'
)

/** Off-field Energy Regen portion of ChiefSidekick's phase description. */
function ChiefSidekickEnerRegenDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_ChiefSidekick_gen')
  const fullDesc = t(`wengine_ChiefSidekick_gen:phaseDescs.${phase - 1}`)
  const marker = 'When the equipper is not the active character'
  const startIdx = fullDesc.indexOf(marker)
  if (startIdx === -1) return <GameText text={fullDesc} />
  const endIdx = fullDesc.indexOf('. ', startIdx)
  if (endIdx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(startIdx, endIdx + 1)} />
}

/** Conditional portion of ChiefSidekick's phase description (from "When the equipper deals Fire DMG" to end). */
function ChiefSidekickCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_ChiefSidekick_gen')
  const fullDesc = t(`wengine_ChiefSidekick_gen:phaseDescs.${phase - 1}`)
  // The text has <ct> tags, so we search for the unique plain-text anchor
  const marker = 'the equipper deals'
  const idx = fullDesc.indexOf(marker)
  if (idx < 0) return <GameText text={fullDesc} />
  // Find the start of "When " before this marker
  const start = fullDesc.lastIndexOf('When', idx)
  if (start < 0) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(start)} />
}

/** Self CR portion of SerpentineSeeker's phase description (first sentence). */
const SerpentineSeekerSelfCritDesc = firstSentenceDesc(
  'wengine_SerpentineSeeker_gen'
)

/** Anomaly Buildup Rate portion of FlightOfFancy's phase description (first sentence). */
const FlightOfFancyBuildupDesc = firstSentenceDesc('wengine_FlightOfFancy_gen')

/** Conditional portion of FlightOfFancy's phase description (from "When" to end). */
const FlightOfFancyCondDesc = fromMarkerDesc(
  'wengine_FlightOfFancy_gen',
  'When '
)

/** Conditional portion of SerpentineSeeker's phase description (from "When" to end). */
const SerpentineSeekerCondDesc = fromMarkerDesc(
  'wengine_SerpentineSeeker_gen',
  'When '
)

/** Self AP portion of NeonFantasies's phase description (first sentence). */
const NeonFantasiesSelfAPDesc = firstSentenceDesc('wengine_NeonFantasies_gen')

/** Conditional portion of NeonFantasies's phase description (from "When" to end). */
const NeonFantasiesCondDesc = fromMarkerDesc(
  'wengine_NeonFantasies_gen',
  'When '
)

/** CRIT Rate portion of StarlightRiderFaceplate's phase description (first sentence). */
const StarlightRiderFaceplateCRDesc = firstSentenceDesc(
  'wengine_StarlightRiderFaceplate_gen'
)

/** Conditional portion of StarlightRiderFaceplate's phase description (from "When" to end). */
const StarlightRiderFaceplateCondDesc = fromMarkerDesc(
  'wengine_StarlightRiderFaceplate_gen',
  'When '
)

/** Conditional portion of BoisterousEchoes' phase description (from "When attacking" to end). */
const BoisterousEchoesCondDesc = fromMarkerDesc(
  'wengine_BoisterousEchoes_gen',
  'When attacking'
)

/** CRIT Rate portion of WrathfulVajra's phase description (first sentence). */
const WrathfulVajraCritDesc = firstSentenceDesc('wengine_WrathfulVajra_gen')

/** Off-field ER portion of YesterdayCalls's phase description (first sentence). */
const YesterdayCallsOffFieldDesc = firstSentenceDesc(
  'wengine_YesterdayCalls_gen'
)

/** Conditional portion of YesterdayCalls's phase description (from "When" to end). */
const YesterdayCallsCondDesc = fromMarkerDesc(
  'wengine_YesterdayCalls_gen',
  'When '
)

/** ER portion of DreamlitHearth's phase description (first sentence). */
const DreamlitHearthERDesc = firstSentenceDesc('wengine_DreamlitHearth_gen')

/** Conditional portion of DreamlitHearth's phase description (from "When" onward). */
const DreamlitHearthCondDesc = fromMarkerDesc(
  'wengine_DreamlitHearth_gen',
  'When '
)

/** Physical RES Ign portion of CloudcleaveRadiance's phase description (first sentence). */
const CloudcleaveRadianceResIgnDesc = firstSentenceDesc(
  'wengine_CloudcleaveRadiance_gen'
)

/** Conditional portion of CloudcleaveRadiance's phase description (from "When" to end). */
const CloudcleaveRadianceCondDesc = fromMarkerDesc(
  'wengine_CloudcleaveRadiance_gen',
  'When '
)

/** AP portion of AngelInTheShell's phase description (first sentence). */
const AngelInTheShellAPDesc = firstSentenceDesc('wengine_AngelInTheShell_gen')

/** Conditional portion of AngelInTheShell's phase description (from "When" to end). */
const AngelInTheShellCondDesc = fromMarkerDesc(
  'wengine_AngelInTheShell_gen',
  'When '
)

/** Off-field ER portion of Thoughtbop's phase description (first sentence). */
const ThoughtbopOffFieldDesc = firstSentenceDesc('wengine_Thoughtbop_gen')

/** Conditional portion of Thoughtbop's phase description (from "When" to end). */
const ThoughtbopCondDesc = fromMarkerDesc('wengine_Thoughtbop_gen', 'When ')

/** Ice Sheer DMG portion of KrakensCradle's phase description (everything before the CRIT Rate sentence). */
function KrakensCradleSheerDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_KrakensCradle_gen')
  const fullDesc = t(`wengine_KrakensCradle_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf("When the equipper's HP falls")
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx)} />
}

/** CRIT Rate portion of KrakensCradle's phase description (from "When the equipper's HP falls" to end). */
const KrakensCradleCritDesc = fromMarkerDesc(
  'wengine_KrakensCradle_gen',
  "When the equipper's HP falls"
)

/** Conditional portion of WrathfulVajra's phase description (from "When" to end). */
const WrathfulVajraCondDesc = fromMarkerDesc(
  'wengine_WrathfulVajra_gen',
  'When '
)

/** CRIT Rate portion of CordisGermina's phase description (first sentence). */
const CordisGerminaCritDesc = firstSentenceDesc('wengine_CordisGermina_gen')

/** Conditional portion of CordisGermina's phase description (from "When" to end). */
const CordisGerminaCondDesc = fromMarkerDesc(
  'wengine_CordisGermina_gen',
  'When '
)

/** CRIT Rate portion of BellicoseBlaze's phase description (first sentence). */
const BellicoseBlazeCRDesc = firstSentenceDesc('wengine_BellicoseBlaze_gen')

/** Conditional portion of BellicoseBlaze's phase description (from "When" to end). */
const BellicoseBlazeCondDesc = fromMarkerDesc(
  'wengine_BellicoseBlaze_gen',
  'When '
)

/** Self CRIT Rate portion of QingmingBirdcage's phase description (first sentence). */
const QingmingBirdcageCritDesc = firstSentenceDesc(
  'wengine_QingmingBirdcage_gen'
)

/** Conditional portion of QingmingBirdcage's phase description (from "When the equipper launches" to end). */
const QingmingBirdcageCondDesc = fromMarkerDesc(
  'wengine_QingmingBirdcage_gen',
  'When the equipper launches'
)

/** Self Anomaly Mastery portion of PracticedPerfection's phase description (first sentence). */
const PracticedPerfectionAnomMasDesc = firstSentenceDesc(
  'wengine_PracticedPerfection_gen'
)

/** Conditional portion of PracticedPerfection's phase description (from "When inflicting Assault" to end). */
const PracticedPerfectionCondDesc = fromMarkerDesc(
  'wengine_PracticedPerfection_gen',
  'When inflicting'
)

/** Self Anomaly Proficiency portion of OdeOfResurrectedWings's phase description (first sentence). */
const OdeOfResurrectedWingsAPDesc = firstSentenceDesc(
  'wengine_OdeOfResurrectedWings_gen'
)

/** Conditional portion of OdeOfResurrectedWings's phase description (from "When" to end). */
const OdeOfResurrectedWingsCondDesc = fromMarkerDesc(
  'wengine_OdeOfResurrectedWings_gen',
  'When '
)

/** Self Anomaly Mastery portion of Metanukimorphosis's phase description (first sentence). */
const MetanukimorphosisAnomMasDesc = firstSentenceDesc(
  'wengine_Metanukimorphosis_gen'
)

/** Conditional portion of Metanukimorphosis's phase description (second and third sentences). */
function MetanukimorphosisAftershockDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Metanukimorphosis_gen')
  const fullDesc = t(`wengine_Metanukimorphosis_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf('. ')
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(idx + 2)} />
}

/** Daze portion of RoaringFurnace's phase description (first part). */
function RoaringFurnaceDazeDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_RoaringFurnace_gen')
  const dazeDesc = t(`wengine_RoaringFurnace_gen:phaseDescs.${phase - 1}.0`)
  return <GameText text={dazeDesc} />
}

/** Conditional portion of RoaringFurnace's phase description (second part). */
function RoaringFurnaceCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_RoaringFurnace_gen')
  const condDesc = t(`wengine_RoaringFurnace_gen:phaseDescs.${phase - 1}.1`)
  return <GameText text={condDesc} />
}

/** DEF Reduction portion of SpectralGaze's phase description (first two sentences). */
function SpectralGazeDefRedDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_SpectralGaze_gen')
  const fullDesc = t(`wengine_SpectralGaze_gen:phaseDescs.${phase - 1}`)
  const marker = 'Passive effects of the same name do not stack.'
  const idx = fullDesc.indexOf(marker)
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx + marker.length)} />
}

/** CRIT DMG portion of MyriadEclipse's phase description (first sentence). */
const MyriadEclipseCritDesc = firstSentenceDesc('wengine_MyriadEclipse_gen')

/** Conditional portion of MyriadEclipse's phase description (from "When using" to end). */
const MyriadEclipseCondDesc = fromMarkerDesc(
  'wengine_MyriadEclipse_gen',
  'When using'
)

const WenginePassiveGroup = memo(function WenginePassiveGroup({
  wengineKey,
  header,
  fields,
  tagForPassiveFields,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  header?: Header
  fields: TagField[]
  tagForPassiveFields: Record<string, any>
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  descriptionOverride?: ReactNode
}) {
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const ns = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`
  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          <Text size="xs">{header?.text}</Text>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {header?.text}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={ns} key18={descKey} />}
        </Text>
        {fields.length > 0 && (
          <>
            <hr />
            <Box mt={4}>
              <TagContext.Provider value={tagForPassiveFields as any}>
                {fields.map((field, i) => (
                  <TagFieldDisplay
                    key={i}
                    field={{
                      ...field,
                      title: (
                        <TagDisplay tag={field.fieldRef} preventRecursion />
                      ),
                    }}
                    showZero={true}
                  />
                ))}
              </TagContext.Provider>
            </Box>
          </>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

const WenginePassiveFieldRow = memo(function WenginePassiveFieldRow({
  wengineKey,
  field,
  tagForPassiveFields,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  field: TagField
  tagForPassiveFields: Record<string, any>
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  /** Replace the default phase description with custom content. */
  descriptionOverride?: ReactNode
}) {
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const ns = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`
  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          <Text size="xs">{field.title}</Text>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {field.title}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={ns} key18={descKey} />}
        </Text>
        <hr />
        <Box mt={4}>
          <TagContext.Provider value={tagForPassiveFields as any}>
            <TagFieldDisplay
              field={{
                ...field,
                title: <TagDisplay tag={field.fieldRef} preventRecursion />,
              }}
              showZero={true}
            />
          </TagContext.Provider>
        </Box>
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

export function WEngineConditionalsDisplay({
  wengineKey,
  teammateKey,
  wenginePhase: propPhase,
  showPassives = false,
}: {
  wengineKey: WengineKey | ''
  teammateKey?: CharacterKey
  /**
   * Wengine phase to use for descriptions. When rendering for a teammate,
   * this should be the teammate's effective wengine phase (which may differ
   * from the main character's). Falls back to the calc context (main char)
   * when not provided.
   */
  wenginePhase?: number
  showPassives?: boolean
}) {
  // Resolve phase: use the prop if provided (teammate context), otherwise
  // fall back to the calc context (main character context)
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const { t } = useTranslation('wengineNames_gen')
  const mainChar = useCharacterContext()!
  const { database } = useDatabaseContext()
  const team = useTeam(mainChar.key)
  const src = teammateKey ?? mainChar.key

  // Extract conditional fields from wengine UI sheet
  const weConditionalFields = useMemo(() => {
    if (!wengineKey) return undefined
    const sheet = wengineUiSheets[wengineKey]
    if (!sheet) return undefined
    // Look up buff metadata to determine if each field is team-wide.
    // Many wengine UI sheets use tagToTagField which doesn't include the
    // team flag, so we need to match by fieldRef.name against the buffs lookup.
    const wengineBuffs = (allBuffs as any)[wengineKey] as
      | Record<string, { team?: boolean }>
      | undefined
    // Helper to check if a field references a buff entry (has fieldRef.name)
    // and returns whether that buff is team-wide.
    function isBuffFieldTeamWide(f: Field): boolean {
      // If the field has an explicit team flag, use it
      if ('team' in f) {
        if (f.team !== false) return true
        if ('fieldRef' in f && f.fieldRef)
          return buffAppliesToMainUnit(f.fieldRef)
        return false
      }
      // Look up by fieldRef.name against buff metadata
      if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name) {
        const buff = wengineBuffs[f.fieldRef.name]
        // If the field matches a buff entry, check its team flag
        if (buff) {
          if (buff.team) return true
          return buffAppliesToMainUnit(f.fieldRef)
        }
        // Fallback: check if it applies to the main unit (e.g. enemy debuffs)
        return buffAppliesToMainUnit(f.fieldRef)
      }
      // If we can't determine (no buff metadata or no matching buff entry),
      // this is not a known buff field — treat as not team-wide
      return false
    }
    // Pre-check: does this wengine have ANY team-wide buffs?
    // If so, conditionals should always be shown in teammate view even if
    // their direct fields are self-only (e.g. Neon Fantasies: stacks
    // conditional's own fields are self-only, but squadDmg_ team buff
    // depends on the stacks value).
    const wengineHasTeamBuffs =
      teammateKey &&
      wengineBuffs &&
      Object.values(wengineBuffs).some((b) => b.team === true)

    const result: Record<string, Field[]> = {}
    sheet.documents.forEach((doc) => {
      // Process 'conditional' documents (interactive conditionals)
      if (doc.type === 'conditional' && doc.conditional) {
        const condName = doc.conditional.metadata.name
        const fields = doc.conditional.fields
        const fieldsArr = fields ?? []
        if (teammateKey) {
          // Collect only fields that match entries in the buff metadata
          // (or have an explicit team flag). Fields that don't match any
          // buff entry (e.g., Duration formulas) can't be used to determine
          // team status.
          const matchingBuffFields = fieldsArr.filter((f: Field) => {
            if ('team' in f) return true
            if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name)
              return !!wengineBuffs[f.fieldRef.name]
            return false
          })
          // Show conditional if:
          // 1) It has team-wide fields directly, OR
          // 2) The wengine has ANY team-wide buffs (the conditional's control
          //    state may affect team-wide buffs defined in other documents)
          const hasTeamBuff =
            matchingBuffFields.length === 0
              ? !!wengineHasTeamBuffs
              : matchingBuffFields.some((f: Field) => isBuffFieldTeamWide(f)) ||
                !!wengineHasTeamBuffs
          if (!hasTeamBuff) return
          // Include team-wide buff fields and informational fields
          // (fields that don't match any entry in the buff metadata).
          const teamFields = fieldsArr.filter(
            (f: Field) =>
              // If no buff metadata, include everything
              !wengineBuffs ||
              // Include informational fields not found in buff metadata
              !(
                'fieldRef' in f &&
                f.fieldRef?.name &&
                wengineBuffs[f.fieldRef.name]
              ) ||
              // Or include team-wide buff fields
              isBuffFieldTeamWide(f)
          )
          // In teammate view, always include the conditional (even with 0 fields)
          // so the interactive control (toggle/slider) is visible. The control
          // state affects team-wide buffs even if this conditional's own fields
          // are self-only.
          if (!result[condName]) result[condName] = []
          result[condName].push(...teamFields)
        } else {
          // Main character view: include all fields
          if (!result[condName]) result[condName] = []
          result[condName].push(...fieldsArr)
        }
      }
    })
    // When in teammate view, return result even if empty so the caller
    // can distinguish "no UI sheet" (undefined) from "all fields filtered" ({}).
    if (teammateKey) return result
    return Object.keys(result).length > 0 ? result : undefined
  }, [wengineKey, teammateKey])

  // Extract localized labels from wengine UI sheet
  const weCondLabels = useMemo(() => {
    if (!wengineKey) return undefined
    const sheet = wengineUiSheets[wengineKey]
    if (!sheet) return undefined
    const result: Record<string, ReactNode> = {}
    sheet.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional?.label) {
        const condName = doc.conditional.metadata.name
        const label = doc.conditional.label
        if (typeof label === 'function') return
        result[condName] = label
      }
    })
    return Object.keys(result).length > 0 ? result : undefined
  }, [wengineKey])

  // Extract passive field groups with headers from 'fields'-type documents
  const passiveFieldGroups = useMemo(() => {
    if (!wengineKey) return undefined
    const sheet = wengineUiSheets[wengineKey]
    if (!sheet) return undefined
    const wengineBuffs = (allBuffs as any)[wengineKey] as
      | Record<string, { team?: boolean }>
      | undefined

    function isBuffFieldTeamWide(f: Field): boolean {
      if ('team' in f) {
        if (f.team !== false) return true
        if ('fieldRef' in f && f.fieldRef)
          return buffAppliesToMainUnit(f.fieldRef)
        return false
      }
      if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name) {
        const buff = wengineBuffs[f.fieldRef.name]
        if (buff) {
          if (buff.team) return true
          return buffAppliesToMainUnit(f.fieldRef)
        }
        return buffAppliesToMainUnit(f.fieldRef)
      }
      return false
    }

    const groups: { header?: Header; fields: Field[] }[] = []
    sheet.documents.forEach((doc) => {
      if (doc.type === 'fields' && doc.fields?.length) {
        if (teammateKey) {
          const matchingBuffFields = doc.fields.filter((f: Field) => {
            if ('team' in f) return true
            if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name)
              return !!wengineBuffs[f.fieldRef.name]
            return false
          })
          const hasTeamBuff =
            matchingBuffFields.length === 0
              ? false
              : matchingBuffFields.some((f: Field) => isBuffFieldTeamWide(f))
          if (!hasTeamBuff) return
          const teamFields = doc.fields.filter(
            (f: Field) =>
              !wengineBuffs ||
              !(
                'fieldRef' in f &&
                f.fieldRef?.name &&
                wengineBuffs[f.fieldRef.name]
              ) ||
              isBuffFieldTeamWide(f)
          )
          groups.push({ header: doc.header, fields: teamFields })
        } else {
          groups.push({ header: doc.header, fields: doc.fields })
        }
      }
    })
    return groups.length > 0 ? groups : undefined
  }, [wengineKey, teammateKey])

  // Tag context for rendering passive team-wide buff fields
  const outerTag = useContext(TagContext)
  const tagForPassiveFields = useMemo(
    () => ({ ...outerTag, src }),
    [outerTag, src]
  )

  // Early return (no hooks after this point)
  if (!wengineKey) {
    return (
      <Flex direction="column" gap={5}>
        <HeaderText>W-Engine Conditionals</HeaderText>
        <Text size="sm" c="dimmed">
          No W-Engine equipped.
        </Text>
      </Flex>
    )
  }

  const wengineConditionals = (conditionals as any)[wengineKey]
  const condEntries = wengineConditionals
    ? (Object.entries(wengineConditionals) as [string, IConditionalData][])
    : []

  const hasPassives = passiveFieldGroups && passiveFieldGroups.length > 0

  // If there are no conditionals AND no passive team fields, show placeholder
  if (condEntries.length === 0 && !hasPassives)
    return (
      <Flex direction="column" gap={5}>
        <HeaderText>{t(wengineKey)} Conditionals</HeaderText>
        <Text size="sm" c="dimmed">
          No conditionals for this W-Engine.
        </Text>
      </Flex>
    )

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>{t(wengineKey)} Conditionals</HeaderText>
      {/* Render passive (always-active) team-wide buffs */}
      {showPassives && hasPassives && (
        <Flex direction="column" gap={4}>
          <TagContext.Provider value={tagForPassiveFields as any}>
            {passiveFieldGroups.map((group, gi) => {
              const tagFields = group.fields.filter(
                (f): f is TagField => 'fieldRef' in f
              )
              const firstFieldName = tagFields[0]?.fieldRef?.name

              // Compute description override for the group based on its fields
              const groupDescOverride: ReactNode | undefined =
                wengineKey === 'SolExuvia' ? (
                  <GameText text="CRIT Rate increases by 20%." />
                ) : wengineKey === 'DreamlitHearth' &&
                  firstFieldName === 'enerRegen' ? (
                  <DreamlitHearthERDesc phase={phase} />
                ) : wengineKey === 'WrathfulVajra' &&
                  firstFieldName === 'passive_crit_' ? (
                  <WrathfulVajraCritDesc phase={phase} />
                ) : wengineKey === 'CloudcleaveRadiance' &&
                  firstFieldName === 'passive_physical_resIgn_' ? (
                  <CloudcleaveRadianceResIgnDesc phase={phase} />
                ) : wengineKey === 'AngelInTheShell' &&
                  firstFieldName === 'passive_anomProf' ? (
                  <AngelInTheShellAPDesc phase={phase} />
                ) : wengineKey === 'ChiefSidekick' &&
                  tagFields.some(
                    (f) =>
                      f.fieldRef?.name === 'impact' ||
                      f.fieldRef?.name === 'fireResIgn_'
                  ) ? (
                  <ChiefSidekickImpactResDesc phase={phase} />
                ) : wengineKey === 'OdeOfResurrectedWings' &&
                  firstFieldName === 'anomProf' ? (
                  <OdeOfResurrectedWingsAPDesc phase={phase} />
                ) : wengineKey === 'JoyauDore' &&
                  firstFieldName === 'anomProf' ? (
                  <JoyauDoreSelfAnomDesc phase={phase} />
                ) : wengineKey === 'JoyauDore' &&
                  firstFieldName === 'squadAnomProf' ? (
                  <JoyauDoreSquadAnomDesc phase={phase} />
                ) : wengineKey === 'HalfSugarBunny' &&
                  firstFieldName === 'passive_enerRegen' ? (
                  <HalfSugarBunnyERDesc phase={phase} />
                ) : wengineKey === 'HalfSugarBunny' &&
                  (firstFieldName === 'passive_atk_' ||
                    firstFieldName === 'passive_hp_') ? (
                  <HalfSugarBunnySquadDesc phase={phase} />
                ) : wengineKey === 'StarlightRiderFaceplate' &&
                  firstFieldName === 'passive_crit_' ? (
                  <StarlightRiderFaceplateCRDesc phase={phase} />
                ) : wengineKey === 'NeonFantasies' &&
                  firstFieldName === 'anomalyProf' ? (
                  <NeonFantasiesSelfAPDesc phase={phase} />
                ) : wengineKey === 'SerpentineSeeker' &&
                  firstFieldName === 'critRate_' ? (
                  <SerpentineSeekerSelfCritDesc phase={phase} />
                ) : wengineKey === 'FlightOfFancy' &&
                  firstFieldName === 'anomBuildup_' ? (
                  <FlightOfFancyBuildupDesc phase={phase} />
                ) : wengineKey === 'CordisGermina' &&
                  firstFieldName === 'passive_crit_' ? (
                  <CordisGerminaCritDesc phase={phase} />
                ) : wengineKey === 'BellicoseBlaze' &&
                  firstFieldName === 'passive_crit_' ? (
                  <BellicoseBlazeCRDesc phase={phase} />
                ) : wengineKey === 'QingmingBirdcage' &&
                  firstFieldName === 'crit_' ? (
                  <QingmingBirdcageCritDesc phase={phase} />
                ) : wengineKey === 'PracticedPerfection' &&
                  firstFieldName === 'anomMas' ? (
                  <PracticedPerfectionAnomMasDesc phase={phase} />
                ) : wengineKey === 'RoaringFurnace' &&
                  firstFieldName === 'exSpecial_dazeInc_' ? (
                  <RoaringFurnaceDazeDesc phase={phase} />
                ) : wengineKey === 'MyriadEclipse' &&
                  firstFieldName === 'crit_dmg_' ? (
                  <MyriadEclipseCritDesc phase={phase} />
                ) : undefined

              return group.header ? (
                <WenginePassiveGroup
                  key={gi}
                  wengineKey={wengineKey}
                  header={group.header}
                  fields={tagFields}
                  tagForPassiveFields={tagForPassiveFields}
                  wenginePhase={phase}
                  descriptionOverride={groupDescOverride}
                />
              ) : (
                tagFields.map((field, i) => (
                  <WenginePassiveFieldRow
                    key={i}
                    wengineKey={wengineKey}
                    field={field}
                    tagForPassiveFields={tagForPassiveFields}
                    wenginePhase={phase}
                    descriptionOverride={groupDescOverride}
                  />
                ))
              )
            })}
          </TagContext.Provider>
        </Flex>
      )}
      {condEntries
        .filter(([condName]) => {
          if (condName === '__passive_team_buffs__') return false
          // If weConditionalFields is provided and condName is missing,
          // all its fields were self-buffs — skip the entire conditional toggle
          if (weConditionalFields && !weConditionalFields[condName])
            return false
          // Check for character-specific restrictions on conditionals
          // SolExuvia's Eclipse effect only works for Pyrois (Phaethon faction)
          if (wengineKey === 'SolExuvia' && condName === 'eclipse_active') {
            const charStat = getCharStat(src)
            if (charStat.faction !== 'Phaethon') return false
          }
          // ChiefSidekick's Off-field Energy Regen is self-only, hide from teammate view
          if (
            wengineKey === 'ChiefSidekick' &&
            condName === 'offField' &&
            teammateKey
          ) {
            return false
          }
          // YesterdayCalls's Off-field Energy Regen is self-only, hide from teammate view
          if (
            wengineKey === 'YesterdayCalls' &&
            condName === 'offField' &&
            teammateKey
          ) {
            return false
          }
          // Thoughtbop's Off-field Energy Regen is self-only, hide from teammate view
          if (
            wengineKey === 'Thoughtbop' &&
            condName === 'offField' &&
            teammateKey
          ) {
            return false
          }
          // Metanukimorphosis: EX Special / Ultimate Physical Hit AM is self-only, hide from teammate view
          if (
            wengineKey === 'Metanukimorphosis' &&
            condName === 'physical_exSpecial_ult' &&
            teammateKey
          ) {
            return false
          }
          // SpectralGaze: Spirit Lock stacks are self-only, hide from teammate view
          if (
            wengineKey === 'SpectralGaze' &&
            condName === 'spiritLock' &&
            teammateKey
          ) {
            return false
          }
          return true
        })
        .map(([condName, condData]) => (
          <WengineConditionalRow
            key={condName}
            wengineKey={wengineKey}
            condName={condName}
            condData={condData}
            team={team}
            database={database}
            mainCharKey={mainChar.key}
            src={src}
            fields={weConditionalFields?.[condName]}
            label={weCondLabels?.[condName]}
            wenginePhase={phase}
            descriptionOverride={
              wengineKey === 'SolExuvia' && condName === 'eclipse_active' ? (
                <SolExuviaEclipseDesc phase={phase} />
              ) : wengineKey === 'JoyauDore' &&
                condName === 'wind_ex_stacks' ? (
                <JoyauDoreCondDesc phase={phase} />
              ) : wengineKey === 'ChiefSidekick' &&
                condName === 'ex_fire_stacks' ? (
                <ChiefSidekickCondDesc phase={phase} />
              ) : wengineKey === 'ChiefSidekick' && condName === 'offField' ? (
                <ChiefSidekickEnerRegenDesc phase={phase} />
              ) : wengineKey === 'HalfSugarBunny' &&
                condName === 'activateExtendEtherVeil' ? (
                <HalfSugarBunnyCondDesc phase={phase} />
              ) : wengineKey === 'StarlightRiderFaceplate' &&
                condName === 'specialUsed' ? (
                <StarlightRiderFaceplateCondDesc phase={phase} />
              ) : wengineKey === 'NeonFantasies' && condName === 'stacks' ? (
                <NeonFantasiesCondDesc phase={phase} />
              ) : wengineKey === 'SerpentineSeeker' &&
                condName === 'energyConsumed20' ? (
                <SerpentineSeekerCondDesc phase={phase} />
              ) : wengineKey === 'FlightOfFancy' && condName === 'etherDmg' ? (
                <FlightOfFancyCondDesc phase={phase} />
              ) : wengineKey === 'BoisterousEchoes' &&
                condName === 'enemy_with_anomaly' ? (
                <BoisterousEchoesCondDesc phase={phase} />
              ) : wengineKey === 'WrathfulVajra' &&
                condName === 'exSpecialAssistLaunched' ? (
                <WrathfulVajraCondDesc phase={phase} />
              ) : wengineKey === 'YesterdayCalls' && condName === 'offField' ? (
                <YesterdayCallsOffFieldDesc phase={phase} />
              ) : wengineKey === 'YesterdayCalls' &&
                condName === 'physExSpecialUsed' ? (
                <YesterdayCallsCondDesc phase={phase} />
              ) : wengineKey === 'DreamlitHearth' &&
                condName === 'etherVeilActive' ? (
                <DreamlitHearthCondDesc phase={phase} />
              ) : wengineKey === 'CloudcleaveRadiance' &&
                condName === 'activatesEtherVeil' ? (
                <CloudcleaveRadianceCondDesc phase={phase} />
              ) : wengineKey === 'AngelInTheShell' &&
                condName === 'onFieldOrSpecialUsed' ? (
                <AngelInTheShellCondDesc phase={phase} />
              ) : wengineKey === 'Thoughtbop' && condName === 'offField' ? (
                <ThoughtbopOffFieldDesc phase={phase} />
              ) : wengineKey === 'Thoughtbop' &&
                condName === 'physExSpecialUsed' ? (
                <ThoughtbopCondDesc phase={phase} />
              ) : wengineKey === 'KrakensCradle' &&
                condName === 'hpDecreased' ? (
                <KrakensCradleSheerDesc phase={phase} />
              ) : wengineKey === 'KrakensCradle' && condName === 'hpBelow50' ? (
                <KrakensCradleCritDesc phase={phase} />
              ) : wengineKey === 'CordisGermina' &&
                condName === 'basic_exSpecial_used' ? (
                <CordisGerminaCondDesc phase={phase} />
              ) : wengineKey === 'BellicoseBlaze' &&
                condName === 'fire_aftershocks' ? (
                <BellicoseBlazeCondDesc phase={phase} />
              ) : wengineKey === 'Metanukimorphosis' &&
                condName === 'physical_exSpecial_ult' ? (
                <MetanukimorphosisAnomMasDesc phase={phase} />
              ) : wengineKey === 'Metanukimorphosis' &&
                condName === 'aftershock' ? (
                <MetanukimorphosisAftershockDesc phase={phase} />
              ) : wengineKey === 'OdeOfResurrectedWings' &&
                condName === 'refringe_triggered' ? (
                <OdeOfResurrectedWingsCondDesc phase={phase} />
              ) : wengineKey === 'QingmingBirdcage' &&
                condName === 'qingmingCompanionStacks' ? (
                <QingmingBirdcageCondDesc phase={phase} />
              ) : wengineKey === 'PracticedPerfection' &&
                condName === 'stacks' ? (
                <PracticedPerfectionCondDesc phase={phase} />
              ) : wengineKey === 'RoaringFurnace' &&
                condName === 'chainOrUlt' ? (
                <RoaringFurnaceCondDesc phase={phase} />
              ) : wengineKey === 'MyriadEclipse' &&
                condName === 'deathSentence' ? (
                <MyriadEclipseCondDesc phase={phase} />
              ) : wengineKey === 'SpectralGaze' &&
                condName === 'hit_aftershock_electric' ? (
                <SpectralGazeDefRedDesc phase={phase} />
              ) : undefined
            }
          />
        ))}
    </Flex>
  )
}

const WengineConditionalRow = memo(function WengineConditionalRow({
  wengineKey,
  condName,
  condData,
  team,
  database,
  mainCharKey,
  src,
  fields,
  label: labelProp,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  condName: string
  condData: IConditionalData
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  mainCharKey: CharacterKey
  src: CharacterKey
  fields?: Field[]
  label?: ReactNode
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  /** Replace the default phase description with custom content. */
  descriptionOverride?: ReactNode
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(() => ({ ...outerTag, src }), [outerTag, src])
  const currentCond = team?.frames[0]?.conditionals?.find(
    (c) => c.sheet === wengineKey && c.condKey === condName && c.src === src
  )
  const currentValue = currentCond?.condValue ?? 0

  const setValue = (condValue: number) => {
    database.teams.setFrameConditional(
      mainCharKey,
      0,
      wengineKey as any,
      condName,
      src as any,
      null,
      condValue
    )
  }

  const label = labelProp ?? condLabel(condName, `wengine_${wengineKey}`)

  // Determine current wengine phase for description
  // Use the prop from parent (which may resolve from teammate data)
  // instead of always reading the calc context (which gives the main char)
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const descNs = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`

  const rowContent = (
    <>
      {condData.type === 'bool' && (
        <Flex justify={conditionalJustify} align={conditionalAlign}>
          <Switch
            style={{ marginRight: 5 }}
            checked={currentValue > 0}
            onChange={(e) => setValue(e.currentTarget.checked ? 1 : 0)}
            size="xs"
          />
          <ConditionalText>{label}</ConditionalText>
        </Flex>
      )}
      {condData.type === 'num' && (
        <NumConditionalRow
          label={label}
          value={currentValue}
          min={condData.min ?? 0}
          max={condData.max ?? 10}
          step={condData.int_only ? 1 : 0.1}
          onChange={setValue}
        />
      )}
      {condData.type === 'list' && (
        <Flex justify={conditionalJustify} align={conditionalAlign}>
          <Select
            style={{ minWidth: 80, width: 80, marginRight: 5 }}
            maxDropdownHeight={500}
            comboboxProps={{ keepMounted: false }}
            data={condData.list.map((item, index) => ({
              label: item,
              value: String(index),
            }))}
            value={String(currentValue)}
            onChange={(v) => setValue(Number(v) || 0)}
            size="xs"
          />
          <ConditionalText>{label}</ConditionalText>
        </Flex>
      )}
      {condData.type !== 'bool' &&
        condData.type !== 'num' &&
        condData.type !== 'list' && (
          <Text size="xs" c="dimmed">
            {label}: unsupported type
          </Text>
        )}
    </>
  )

  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          {rowContent}
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {label}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={descNs} key18={descKey} />}
        </Text>
        {fields && fields.length > 0 && (
          <Box opacity={currentValue === 0 ? 0.5 : undefined}>
            {currentValue > 0 && <hr />}
            <Box mt={4}>
              <TagContext.Provider value={tagForFields as any}>
                {fields.map(
                  (field, i) =>
                    'fieldRef' in field && (
                      <TagFieldDisplay
                        key={i}
                        field={field}
                        showZero={currentValue === 0}
                        rowSx={{
                          paddingTop: 1,
                          paddingBottom: 1,
                          gap: 6,
                        }}
                      />
                    )
                )}
              </TagContext.Provider>
            </Box>
          </Box>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})
