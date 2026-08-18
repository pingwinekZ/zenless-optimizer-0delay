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

/** CRIT DMG portion of MyriadEclipse's phase description (first sentence). */
const MyriadEclipseCritDesc = firstSentenceDesc('wengine_MyriadEclipse_gen')

/** Conditional portion of ElegantVanity's phase description (from "When the equipper consumes" to end). */
const ElegantVanityCondDesc = fromMarkerDesc(
  'wengine_ElegantVanity_gen',
  'When the equipper consumes'
)

/** Conditional portion of MyriadEclipse's phase description (from "When using" to end). */
const MyriadEclipseCondDesc = fromMarkerDesc(
  'wengine_MyriadEclipse_gen',
  'When using'
)

/** Ice DMG portion of BashfulDemon's phase description (first sentence). */
const BashfulDemonIceDmgDesc = firstSentenceDesc('wengine_BashfulDemon_gen')

/** Conditional portion of BashfulDemon's phase description (from "When launching" to end). */
const BashfulDemonCondDesc = fromMarkerDesc(
  'wengine_BashfulDemon_gen',
  'When launching'
)

/** Max HP portion of BunnyBand's phase description (first sentence). */
const BunnyBandHpDesc = firstSentenceDesc('wengine_BunnyBand_gen')

/** Conditional portion of BunnyBand's phase description (second sentence). */
const BunnyBandCondDesc = fromMarkerDesc(
  'wengine_BunnyBand_gen',
  'Increases the equipper'
)

/** Electric DMG portion of DemaraBatteryMarkII's phase description (first sentence). */
const DemaraBatteryMarkIIDmgDesc = firstSentenceDesc(
  'wengine_DemaraBatteryMarkII_gen'
)

/** Conditional portion of DemaraBatteryMarkII's phase description (from "When" to end). */
const DemaraBatteryMarkIICondDesc = fromMarkerDesc(
  'wengine_DemaraBatteryMarkII_gen',
  'When '
)

/** ATK portion of FusionCompiler's phase description (first paragraph). */
function FusionCompilerAtkDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_FusionCompiler_gen')
  const atkDesc = t(`wengine_FusionCompiler_gen:phaseDescs.${phase - 1}.0`)
  return <GameText text={atkDesc} />
}

/** Conditional portion of FusionCompiler's phase description (second paragraph). */
function FusionCompilerCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_FusionCompiler_gen')
  const condDesc = t(`wengine_FusionCompiler_gen:phaseDescs.${phase - 1}.1`)
  return <GameText text={condDesc} />
}

/** Fire DMG portion of GrillOWisp's phase description (first sentence). */
const GrillOWispFireDmgDesc = firstSentenceDesc('wengine_GrillOWisp_gen')

/** Conditional portion of GrillOWisp's phase description (from "When" to end). */
const GrillOWispCondDesc = fromMarkerDesc('wengine_GrillOWisp_gen', 'When ')

/** CRIT DMG portion of HailstormShrine's phase description (first sentence). */
const HailstormShrineCritDmgDesc = firstSentenceDesc(
  'wengine_HailstormShrine_gen'
)

/** Conditional portion of HailstormShrine's phase description (from "When using" to end). */
const HailstormShrineCondDesc = fromMarkerDesc(
  'wengine_HailstormShrine_gen',
  'When using'
)

/** CRIT DMG portion of HeartstringNocturne's phase description (first sentence). */
const HeartstringNocturneCritDmgDesc = firstSentenceDesc(
  'wengine_HeartstringNocturne_gen'
)

/** Conditional portion of HeartstringNocturne's phase description (from "When" to end). */
const HeartstringNocturneCondDesc = fromMarkerDesc(
  'wengine_HeartstringNocturne_gen',
  'When '
)

/** Max HP portion of OriginalTransmorpher's phase description (first sentence). */
const OriginalTransmorpherHpDesc = firstSentenceDesc(
  'wengine_OriginalTransmorpher_gen'
)

/** Conditional portion of OriginalTransmorpher's phase description (from "When attacked" to end). */
const OriginalTransmorpherCondDesc = fromMarkerDesc(
  'wengine_OriginalTransmorpher_gen',
  'When attacked'
)

/** Energy Regen portion of PeacekeeperSpecialized's phase description (first sentence). */
const PeacekeeperSpecializedERDesc = firstSentenceDesc(
  'wengine_PeacekeeperSpecialized_gen'
)

/** Anomaly Buildup portion of PeacekeeperSpecialized's phase description (second sentence). */
const PeacekeeperSpecializedBuildupDesc = fromMarkerDesc(
  'wengine_PeacekeeperSpecialized_gen',
  'The Anomaly Buildup'
)

/** CRIT Rate portion of RiotSuppressorMarkVI's phase description (first sentence). */
const RiotSuppressorMarkVICritDesc = firstSentenceDesc(
  'wengine_RiotSuppressorMarkVI_gen'
)

/** Conditional portion of RiotSuppressorMarkVI's phase description (from "Launching" to end). */
const RiotSuppressorMarkVICondDesc = fromMarkerDesc(
  'wengine_RiotSuppressorMarkVI_gen',
  'Launching '
)

/** DMG Reduction portion of SpringEmbrace's phase description (first sentence). */
const SpringEmbraceDmgRedDesc = firstSentenceDesc('wengine_SpringEmbrace_gen')

/** Conditional portion of SpringEmbrace's phase description (from "When attacked" to end). */
const SpringEmbraceCondDesc = fromMarkerDesc(
  'wengine_SpringEmbrace_gen',
  'When attacked'
)

/** Physical DMG portion of SteelCushion's phase description (first sentence). */
const SteelCushionPhysDmgDesc = firstSentenceDesc('wengine_SteelCushion_gen')

/** Conditional portion of SteelCushion's phase description (second sentence). */
const SteelCushionCondDesc = fromMarkerDesc(
  'wengine_SteelCushion_gen',
  "The equipper's DMG"
)

/** Shield portion of TusksOfFury's phase description (first sentence). */
const TusksOfFuryShieldDesc = firstSentenceDesc('wengine_TusksOfFury_gen')

/** Conditional portion of TusksOfFury's phase description (from "When" to end). */
const TusksOfFuryCondDesc = fromMarkerDesc('wengine_TusksOfFury_gen', 'When ')

/** CRIT Rate portion of ZanshinHerbCase's phase description (first sentence). */
const ZanshinHerbCaseCritDesc = firstSentenceDesc('wengine_ZanshinHerbCase_gen')

/** Dash Electric DMG portion of ZanshinHerbCase's phase description (second sentence). */
function ZanshinHerbCaseDashDmgDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_ZanshinHerbCase_gen')
  const fullDesc = t(`wengine_ZanshinHerbCase_gen:phaseDescs.${phase - 1}`)
  const firstDot = fullDesc.indexOf('. ')
  if (firstDot === -1) return <GameText text={fullDesc} />
  const secondDot = fullDesc.indexOf('. ', firstDot + 2)
  if (secondDot === -1) return <GameText text={fullDesc.slice(firstDot + 2)} />
  return <GameText text={fullDesc.slice(firstDot + 2, secondDot + 1)} />
}

/** Conditional portion of ZanshinHerbCase's phase description (from "When any squad member" to end). */
const ZanshinHerbCaseCondDesc = fromMarkerDesc(
  'wengine_ZanshinHerbCase_gen',
  'When any squad member'
)

/** ATK portion of CannonRotor's phase description (first sentence). */
const CannonRotorAtkDesc = firstSentenceDesc('wengine_CannonRotor_gen')

/** Critical-hit Additional DMG portion of CannonRotor's phase description (after the first sentence). */
function CannonRotorDmgDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_CannonRotor_gen')
  const fullDesc = t(`wengine_CannonRotor_gen:phaseDescs.${phase - 1}`)
  const idx = fullDesc.indexOf('. ')
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(idx + 2)} />
}

/** Electric Anomaly Buildup + Special Attack portion of Timeweaver's phase description (first paragraph). */
function TimeweaverCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Timeweaver_gen')
  const fullDesc = t(`wengine_Timeweaver_gen:phaseDescs.${phase - 1}.0`)
  const marker = 'When '
  const idx = fullDesc.indexOf(marker)
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(idx)} />
}

/** Electric Anomaly Buildup portion of Timeweaver's phase description (first sentence of the first paragraph). */
function TimeweaverElectricBuildupDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Timeweaver_gen')
  const part0 = t(`wengine_Timeweaver_gen:phaseDescs.${phase - 1}.0`)
  const idx = part0.indexOf('. ')
  const buildup = idx === -1 ? part0 : part0.slice(0, idx + 1)
  return <GameText text={buildup} />
}

/** Disorder DMG portion of Timeweaver's phase description (second paragraph). */
function TimeweaverDisorderDmgDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Timeweaver_gen')
  const part1 = t(`wengine_Timeweaver_gen:phaseDescs.${phase - 1}.1`)
  return <GameText text={part1} />
}

/** Off-field Energy Regen portion of HellfireGears's phase description (first part). */
function HellfireGearsOffFieldDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_HellfireGears_gen')
  const desc = t(`wengine_HellfireGears_gen:phaseDescs.${phase - 1}.0`)
  return <GameText text={desc} />
}

/** EX Special Impact portion of HellfireGears's phase description (second part). */
function HellfireGearsCondDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_HellfireGears_gen')
  const desc = t(`wengine_HellfireGears_gen:phaseDescs.${phase - 1}.1`)
  return <GameText text={desc} />
}

/** RoaringRide's phase description (both parts). */
function RoaringRideDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_RoaringRide_gen')
  const desc0 = t(`wengine_RoaringRide_gen:phaseDescs.${phase - 1}.0`)
  const desc1 = t(`wengine_RoaringRide_gen:phaseDescs.${phase - 1}.1`)
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <GameText text={desc0} />
      </div>
      <GameText text={desc1} />
    </>
  )
}

/** Battle Edge portion of KnightsExtolment's phase description (both parts). */
function KnightsExtolmentDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_KnightsExtolment_gen')
  const desc0 = t(`wengine_KnightsExtolment_gen:phaseDescs.${phase - 1}.0`)
  const desc1 = t(`wengine_KnightsExtolment_gen:phaseDescs.${phase - 1}.1`)
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <GameText text={desc0} />
      </div>
      <GameText text={desc1} />
    </>
  )
}

/** CRIT DMG portion of SeveredInnocence's phase description (first sentence). */
const SeveredInnocenceCritDesc = firstSentenceDesc(
  'wengine_SeveredInnocence_gen'
)

/** Conditional portion of SeveredInnocence's phase description (from "When the equipper lands" to end). */
const SeveredInnocenceCondDesc = fromMarkerDesc(
  'wengine_SeveredInnocence_gen',
  'When the equipper lands'
)

/** DEF Reduction portion of SpectralGaze's phase description (first two sentences). */
function SpectralGazeDefRedDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_SpectralGaze_gen')
  const fullDesc = t(`wengine_SpectralGaze_gen:phaseDescs.${phase - 1}`)
  const marker = 'Passive effects of the same name do not stack.'
  const idx = fullDesc.indexOf(marker)
  if (idx === -1) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(0, idx + marker.length)} />
}

/** Conditional portion of SpectralGaze's phase description (from "When this effect is triggered" to end). */
const SpectralGazeSpiritLockDesc = fromMarkerDesc(
  'wengine_SpectralGaze_gen',
  'When this effect is triggered'
)

/** Ice DMG portion of DeepSeaVisitor's phase description (first sentence). */
const DeepSeaVisitorIceDmgDesc = firstSentenceDesc('wengine_DeepSeaVisitor_gen')

/** Basic Attack CRIT portion of DeepSeaVisitor's phase description (second sentence). */
function DeepSeaVisitorBasicCritDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_DeepSeaVisitor_gen')
  const fullDesc = t(`wengine_DeepSeaVisitor_gen:phaseDescs.${phase - 1}`)
  const marker = 'Upon hitting'
  const startIdx = fullDesc.indexOf(marker)
  if (startIdx === -1) return <GameText text={fullDesc} />
  const endIdx = fullDesc.indexOf('. ', startIdx)
  if (endIdx === -1) return <GameText text={fullDesc.slice(startIdx)} />
  return <GameText text={fullDesc.slice(startIdx, endIdx + 1)} />
}

/** Ice Dash CRIT portion of DeepSeaVisitor's phase description (from "When dealing" to end). */
const DeepSeaVisitorIceDashCritDesc = fromMarkerDesc(
  'wengine_DeepSeaVisitor_gen',
  'When dealing'
)

/** Off-field Energy Regen portion of Housekeeper's phase description (first sentence). */
const HousekeeperOffFieldDesc = firstSentenceDesc('wengine_Housekeeper_gen')

/** Conditional portion of Housekeeper's phase description (from "When an EX Special Attack" to end). */
function HousekeeperExSpecialHitDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_Housekeeper_gen')
  const fullDesc = t(`wengine_Housekeeper_gen:phaseDescs.${phase - 1}`)
  // The text has <ct> tags, so we search for the unique plain-text anchor
  const marker = 'hits an enemy'
  const idx = fullDesc.indexOf(marker)
  if (idx < 0) return <GameText text={fullDesc} />
  // Find the start of "When an " before this marker
  const start = fullDesc.lastIndexOf('When an ', idx)
  if (start < 0) return <GameText text={fullDesc} />
  return <GameText text={fullDesc.slice(start)} />
}

/** Quick/Perfect Assist Impact portion of BlazingLaurel's phase description (first sentence). */
const BlazingLaurelAssistImpactDesc = firstSentenceDesc(
  'wengine_BlazingLaurel_gen'
)

/** Wilt portion of BlazingLaurel's phase description (from "When the equipper launches" to end). */
const BlazingLaurelWiltDesc = fromMarkerDesc(
  'wengine_BlazingLaurel_gen',
  'When the equipper launches'
)

/** Off-field Energy Regen portion of FlamemakerShaker's phase description (first sentence). */
const FlamemakerShakerOffFieldDesc = firstSentenceDesc(
  'wengine_FlamemakerShaker_gen'
)

/** Conditional portion of FlamemakerShaker's phase description (from "When hitting" to end). */
const FlamemakerShakerCondDesc = fromMarkerDesc(
  'wengine_FlamemakerShaker_gen',
  'When hitting'
)

/** DMG Reduction portion of BigCylinder's phase description (first sentence). */
const BigCylinderDmgRedDesc = firstSentenceDesc('wengine_BigCylinder_gen')

/** Additional DMG portion of BigCylinder's phase description (from "After being attacked" to end). */
const BigCylinderDmgDesc = fromMarkerDesc(
  'wengine_BigCylinder_gen',
  'After being attacked'
)

/** EX Special & Ultimate DMG portion of TremorTrigramVessel's phase description (first sentence). */
const TremorTrigramVesselDmgDesc = firstSentenceDesc(
  'wengine_TremorTrigramVessel_gen'
)

/** Off-field Energy Regen portion of WeepingCradle's phase description (first sentence). */
const WeepingCradleOffFieldDesc = firstSentenceDesc('wengine_WeepingCradle_gen')

/** DMG Stacks portion of WeepingCradle's phase description (from "Attacks from" to end). */
const WeepingCradleDmgDesc = fromMarkerDesc(
  'wengine_WeepingCradle_gen',
  'Attacks from'
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
          // JoyauDore: self-only AP passive should not show for teammates
          if (
            wengineKey === 'JoyauDore' &&
            matchingBuffFields.some(
              (f) => 'fieldRef' in f && f.fieldRef?.name === 'anomProf'
            )
          ) {
            return
          }
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
        <Text size="sm" c="dimmed">
          No conditionals for this W-Engine.
        </Text>
      </Flex>
    )

  return (
    <Flex direction="column" gap={5}>
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
                ) : wengineKey === 'BashfulDemon' &&
                  firstFieldName === 'passive_ice_dmg_' ? (
                  <BashfulDemonIceDmgDesc phase={phase} />
                ) : wengineKey === 'BunnyBand' &&
                  firstFieldName === 'passive_hp_' ? (
                  <BunnyBandHpDesc phase={phase} />
                ) : wengineKey === 'DemaraBatteryMarkII' &&
                  firstFieldName === 'passive_electric_dmg_' ? (
                  <DemaraBatteryMarkIIDmgDesc phase={phase} />
                ) : wengineKey === 'FusionCompiler' &&
                  firstFieldName === 'passive_atk_' ? (
                  <FusionCompilerAtkDesc phase={phase} />
                ) : wengineKey === 'GrillOWisp' &&
                  firstFieldName === 'fire_dmg_' ? (
                  <GrillOWispFireDmgDesc phase={phase} />
                ) : wengineKey === 'HailstormShrine' &&
                  firstFieldName === 'passive_crit_dmg_' ? (
                  <HailstormShrineCritDmgDesc phase={phase} />
                ) : wengineKey === 'HeartstringNocturne' &&
                  firstFieldName === 'passive_crit_dmg_' ? (
                  <HeartstringNocturneCritDmgDesc phase={phase} />
                ) : wengineKey === 'OriginalTransmorpher' &&
                  firstFieldName === 'passive_hp_' ? (
                  <OriginalTransmorpherHpDesc phase={phase} />
                ) : wengineKey === 'PeacekeeperSpecialized' &&
                  firstFieldName === 'passive_exSpecial_anomBuildup_' ? (
                  <PeacekeeperSpecializedBuildupDesc phase={phase} />
                ) : wengineKey === 'RiotSuppressorMarkVI' &&
                  firstFieldName === 'passive_crit_' ? (
                  <RiotSuppressorMarkVICritDesc phase={phase} />
                ) : wengineKey === 'SpringEmbrace' &&
                  firstFieldName === 'passive_dmg_red_' ? (
                  <SpringEmbraceDmgRedDesc phase={phase} />
                ) : wengineKey === 'SteelCushion' &&
                  firstFieldName === 'passive_physical_dmg_' ? (
                  <SteelCushionPhysDmgDesc phase={phase} />
                ) : wengineKey === 'TusksOfFury' &&
                  firstFieldName === 'passive_shield_' ? (
                  <TusksOfFuryShieldDesc phase={phase} />
                ) : wengineKey === 'ZanshinHerbCase' &&
                  firstFieldName === 'passive_crit_' ? (
                  <ZanshinHerbCaseCritDesc phase={phase} />
                ) : wengineKey === 'ZanshinHerbCase' &&
                  firstFieldName === 'passive_electric_dmg_' ? (
                  <ZanshinHerbCaseDashDmgDesc phase={phase} />
                ) : wengineKey === 'CannonRotor' &&
                  firstFieldName === 'passive_atk_' ? (
                  <CannonRotorAtkDesc phase={phase} />
                ) : wengineKey === 'CannonRotor' &&
                  firstFieldName === 'damage' ? (
                  <CannonRotorDmgDesc phase={phase} />
                ) : wengineKey === 'DeepSeaVisitor' &&
                  firstFieldName === 'passive_ice_dmg_' ? (
                  <DeepSeaVisitorIceDmgDesc phase={phase} />
                ) : wengineKey === 'SeveredInnocence' &&
                  firstFieldName === 'passive_crit_dmg_' ? (
                  <SeveredInnocenceCritDesc phase={phase} />
                ) : wengineKey === 'Timeweaver' &&
                  firstFieldName === 'passive_electric_anomBuildup_' ? (
                  <TimeweaverElectricBuildupDesc phase={phase} />
                ) : wengineKey === 'Timeweaver' &&
                  firstFieldName === 'passive_disorder_dmg_' ? (
                  <TimeweaverDisorderDmgDesc phase={phase} />
                ) : wengineKey === 'BigCylinder' &&
                  firstFieldName === 'passive_dmg_red_' ? (
                  <BigCylinderDmgRedDesc phase={phase} />
                ) : wengineKey === 'BigCylinder' &&
                  firstFieldName === 'damage' ? (
                  <BigCylinderDmgDesc phase={phase} />
                ) : wengineKey === 'TremorTrigramVessel' &&
                  firstFieldName === 'exSpecial_dmg_' ? (
                  <TremorTrigramVesselDmgDesc phase={phase} />
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
          // SpectralGaze: Spirit Lock stacks are self-only (equipper Impact), hide from teammate view
          if (
            wengineKey === 'SpectralGaze' &&
            condName === 'spiritLock' &&
            teammateKey
          ) {
            return false
          }
          // BlazingLaurel: Quick/Perfect Assist Impact is self-only, hide from teammate view
          if (
            wengineKey === 'BlazingLaurel' &&
            condName === 'quickOrPerfectAssistUsed' &&
            teammateKey
          ) {
            return false
          }
          // WeepingCradle: Off-field Energy Regen is self-only, hide from teammate view
          if (
            wengineKey === 'WeepingCradle' &&
            condName === 'offField' &&
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
              ) : wengineKey === 'ElegantVanity' &&
                condName === 'consumed25Energy' ? (
                <ElegantVanityCondDesc phase={phase} />
              ) : wengineKey === 'BashfulDemon' &&
                condName === 'launch_ex_attack' ? (
                <BashfulDemonCondDesc phase={phase} />
              ) : wengineKey === 'BunnyBand' &&
                condName === 'wearerShielded' ? (
                <BunnyBandCondDesc phase={phase} />
              ) : wengineKey === 'DemaraBatteryMarkII' &&
                condName === 'dodgeCounterOrAssistHit' ? (
                <DemaraBatteryMarkIICondDesc phase={phase} />
              ) : wengineKey === 'FusionCompiler' &&
                condName === 'specialUsed' ? (
                <FusionCompilerCondDesc phase={phase} />
              ) : wengineKey === 'GrillOWisp' && condName === 'hpDecreased' ? (
                <GrillOWispCondDesc phase={phase} />
              ) : wengineKey === 'HailstormShrine' &&
                condName === 'exSpecialOrAnomaly' ? (
                <HailstormShrineCondDesc phase={phase} />
              ) : wengineKey === 'HeartstringNocturne' &&
                condName === 'heartstring' ? (
                <HeartstringNocturneCondDesc phase={phase} />
              ) : wengineKey === 'OriginalTransmorpher' &&
                condName === 'equipperHit' ? (
                <OriginalTransmorpherCondDesc phase={phase} />
              ) : wengineKey === 'PeacekeeperSpecialized' &&
                condName === 'shielded' ? (
                <PeacekeeperSpecializedERDesc phase={phase} />
              ) : wengineKey === 'RiotSuppressorMarkVI' &&
                condName === 'charge' ? (
                <RiotSuppressorMarkVICondDesc phase={phase} />
              ) : wengineKey === 'SpringEmbrace' &&
                condName === 'when_attacked' ? (
                <SpringEmbraceCondDesc phase={phase} />
              ) : wengineKey === 'SteelCushion' && condName === 'hit_behind' ? (
                <SteelCushionCondDesc phase={phase} />
              ) : wengineKey === 'TusksOfFury' &&
                condName === 'interrupt_perfdodge' ? (
                <TusksOfFuryCondDesc phase={phase} />
              ) : wengineKey === 'ZanshinHerbCase' &&
                condName === 'apply_anom_stun' ? (
                <ZanshinHerbCaseCondDesc phase={phase} />
              ) : wengineKey === 'Timeweaver' && condName === 'hit_anomaly' ? (
                <TimeweaverCondDesc phase={phase} />
              ) : wengineKey === 'DeepSeaVisitor' && condName === 'basicHit' ? (
                <DeepSeaVisitorBasicCritDesc phase={phase} />
              ) : wengineKey === 'DeepSeaVisitor' &&
                condName === 'iceDashAtkHit' ? (
                <DeepSeaVisitorIceDashCritDesc phase={phase} />
              ) : wengineKey === 'SeveredInnocence' &&
                condName === 'basicSpecialAftershockHit' ? (
                <SeveredInnocenceCondDesc phase={phase} />
              ) : wengineKey === 'SpectralGaze' &&
                condName === 'hit_aftershock_electric' ? (
                <SpectralGazeDefRedDesc phase={phase} />
              ) : wengineKey === 'SpectralGaze' && condName === 'spiritLock' ? (
                <SpectralGazeSpiritLockDesc phase={phase} />
              ) : wengineKey === 'HellfireGears' && condName === 'offField' ? (
                <HellfireGearsOffFieldDesc phase={phase} />
              ) : wengineKey === 'HellfireGears' &&
                condName === 'exSpecialUsed' ? (
                <HellfireGearsCondDesc phase={phase} />
              ) : wengineKey === 'RoaringRide' ? (
                <RoaringRideDesc phase={phase} />
              ) : wengineKey === 'KnightsExtolment' &&
                condName === 'battle_edge_stacks' ? (
                <KnightsExtolmentDesc phase={phase} />
              ) : wengineKey === 'Housekeeper' && condName === 'offField' ? (
                <HousekeeperOffFieldDesc phase={phase} />
              ) : wengineKey === 'Housekeeper' &&
                condName === 'exSpecialHits' ? (
                <HousekeeperExSpecialHitDesc phase={phase} />
              ) : wengineKey === 'BlazingLaurel' &&
                condName === 'quickOrPerfectAssistUsed' ? (
                <BlazingLaurelAssistImpactDesc phase={phase} />
              ) : wengineKey === 'BlazingLaurel' && condName === 'wilt' ? (
                <BlazingLaurelWiltDesc phase={phase} />
              ) : wengineKey === 'FlamemakerShaker' &&
                condName === 'offField' ? (
                <FlamemakerShakerOffFieldDesc phase={phase} />
              ) : wengineKey === 'FlamemakerShaker' &&
                condName === 'exSpecialAssistHits' ? (
                <FlamemakerShakerCondDesc phase={phase} />
              ) : wengineKey === 'BigCylinder' &&
                condName === 'afterAttacked' ? (
                <BigCylinderDmgDesc phase={phase} />
              ) : wengineKey === 'WeepingCradle' && condName === 'offField' ? (
                <WeepingCradleOffFieldDesc phase={phase} />
              ) : wengineKey === 'WeepingCradle' && condName === 'stacks' ? (
                <WeepingCradleDmgDesc phase={phase} />
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
