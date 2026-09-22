import type { TagField } from '@zenless-optimizer/game-opt/sheet-ui'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { GameText } from '@zenless-optimizer/zzz/i18n'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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

/** Ice Dash CRIT portion of DeepSeaVisitor's phase description (from "When dealing" to end of that sentence). */
function DeepSeaVisitorIceDashCritDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_DeepSeaVisitor_gen')
  const fullDesc = t(`wengine_DeepSeaVisitor_gen:phaseDescs.${phase - 1}`)
  const marker = 'When dealing'
  const startIdx = fullDesc.indexOf(marker)
  if (startIdx === -1) return <GameText text={fullDesc} />
  const endIdx = fullDesc.indexOf('. ', startIdx)
  if (endIdx === -1) return <GameText text={fullDesc.slice(startIdx)} />
  return <GameText text={fullDesc.slice(startIdx, endIdx + 1)} />
}

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

/** CRIT Rate portion of CrimsonMoonCasket's phase description (first sentence). */
const CrimsonMoonCasketCritDesc = firstSentenceDesc(
  'wengine_CrimsonMoonCasket_gen'
)

/** Wind RES Ignore portion of CrimsonMoonCasket's phase description (second sentence). */
function CrimsonMoonCasketResIgnDesc({ phase }: { phase: number }) {
  const { t } = useTranslation('wengine_CrimsonMoonCasket_gen')
  const fullDesc = t(`wengine_CrimsonMoonCasket_gen:phaseDescs.${phase - 1}`)
  const firstDot = fullDesc.indexOf('. ')
  if (firstDot === -1) return <GameText text={fullDesc} />
  const secondDot = fullDesc.indexOf('. ', firstDot + 2)
  if (secondDot === -1) return <GameText text={fullDesc.slice(firstDot + 2)} />
  return <GameText text={fullDesc.slice(firstDot + 2, secondDot + 1)} />
}

/** Conditional portion of CrimsonMoonCasket's phase description (from "When the equipper uses" to end). */
const CrimsonMoonCasketCondDesc = fromMarkerDesc(
  'wengine_CrimsonMoonCasket_gen',
  'When the equipper uses'
)

/** CRIT Rate & Electric DMG portion of CrimsonThirst's phase description (first sentence). */
const CrimsonThirstPassiveDesc = firstSentenceDesc('wengine_CrimsonThirst_gen')

/** Conditional portion of CrimsonThirst's phase description (from "When" to end). */
const CrimsonThirstCondDesc = fromMarkerDesc(
  'wengine_CrimsonThirst_gen',
  'When '
)

/** DEF portion of CattyLuck's phase description (first sentence). */
const CattyLuckPassiveDesc = firstSentenceDesc('wengine_CattyLuck_gen')

/** Conditional portion of CattyLuck's phase description (from "When" to end). */
const CattyLuckCondDesc = fromMarkerDesc('wengine_CattyLuck_gen', 'When ')

export type WengineDesc = ComponentType<{ phase: number }>

/** Passive-group description override, keyed by wengine + first field name. */
export const passiveDescByField: Partial<
  Record<WengineKey, Record<string, WengineDesc>>
> = {
  DreamlitHearth: {
    enerRegen: DreamlitHearthERDesc,
  },
  WrathfulVajra: {
    passive_crit_: WrathfulVajraCritDesc,
  },
  CloudcleaveRadiance: {
    passive_physical_resIgn_: CloudcleaveRadianceResIgnDesc,
  },
  AngelInTheShell: {
    passive_anomProf: AngelInTheShellAPDesc,
  },
  OdeOfResurrectedWings: {
    anomProf: OdeOfResurrectedWingsAPDesc,
  },
  JoyauDore: {
    anomProf: JoyauDoreSelfAnomDesc,
    squadAnomProf: JoyauDoreSquadAnomDesc,
  },
  HalfSugarBunny: {
    passive_enerRegen: HalfSugarBunnyERDesc,
    passive_atk_: HalfSugarBunnySquadDesc,
    passive_hp_: HalfSugarBunnySquadDesc,
  },
  StarlightRiderFaceplate: {
    passive_crit_: StarlightRiderFaceplateCRDesc,
  },
  NeonFantasies: {
    anomalyProf: NeonFantasiesSelfAPDesc,
  },
  SerpentineSeeker: {
    critRate_: SerpentineSeekerSelfCritDesc,
  },
  FlightOfFancy: {
    anomBuildup_: FlightOfFancyBuildupDesc,
  },
  CordisGermina: {
    passive_crit_: CordisGerminaCritDesc,
  },
  BellicoseBlaze: {
    passive_crit_: BellicoseBlazeCRDesc,
  },
  QingmingBirdcage: {
    crit_: QingmingBirdcageCritDesc,
  },
  PracticedPerfection: {
    anomMas: PracticedPerfectionAnomMasDesc,
  },
  RoaringFurnace: {
    exSpecial_dazeInc_: RoaringFurnaceDazeDesc,
  },
  MyriadEclipse: {
    crit_dmg_: MyriadEclipseCritDesc,
  },
  BashfulDemon: {
    passive_ice_dmg_: BashfulDemonIceDmgDesc,
  },
  BunnyBand: {
    passive_hp_: BunnyBandHpDesc,
  },
  DemaraBatteryMarkII: {
    passive_electric_dmg_: DemaraBatteryMarkIIDmgDesc,
  },
  FusionCompiler: {
    passive_atk_: FusionCompilerAtkDesc,
  },
  GrillOWisp: {
    fire_dmg_: GrillOWispFireDmgDesc,
  },
  HailstormShrine: {
    passive_crit_dmg_: HailstormShrineCritDmgDesc,
  },
  HeartstringNocturne: {
    passive_crit_dmg_: HeartstringNocturneCritDmgDesc,
  },
  OriginalTransmorpher: {
    passive_hp_: OriginalTransmorpherHpDesc,
  },
  PeacekeeperSpecialized: {
    passive_exSpecial_anomBuildup_: PeacekeeperSpecializedBuildupDesc,
  },
  RiotSuppressorMarkVI: {
    passive_crit_: RiotSuppressorMarkVICritDesc,
  },
  SpringEmbrace: {
    passive_dmg_red_: SpringEmbraceDmgRedDesc,
  },
  SteelCushion: {
    passive_physical_dmg_: SteelCushionPhysDmgDesc,
  },
  TusksOfFury: {
    passive_shield_: TusksOfFuryShieldDesc,
  },
  ZanshinHerbCase: {
    passive_crit_: ZanshinHerbCaseCritDesc,
    passive_electric_dmg_: ZanshinHerbCaseDashDmgDesc,
  },
  CannonRotor: {
    passive_atk_: CannonRotorAtkDesc,
    damage: CannonRotorDmgDesc,
  },
  DeepSeaVisitor: {
    passive_ice_dmg_: DeepSeaVisitorIceDmgDesc,
  },
  SeveredInnocence: {
    passive_crit_dmg_: SeveredInnocenceCritDesc,
  },
  Timeweaver: {
    passive_electric_anomBuildup_: TimeweaverElectricBuildupDesc,
    passive_disorder_dmg_: TimeweaverDisorderDmgDesc,
  },
  BigCylinder: {
    passive_dmg_red_: BigCylinderDmgRedDesc,
    damage: BigCylinderDmgDesc,
  },
  TremorTrigramVessel: {
    exSpecial_dmg_: TremorTrigramVesselDmgDesc,
  },
  CrimsonMoonCasket: {
    passive_crit_: CrimsonMoonCasketCritDesc,
    passive_windResIgn_: CrimsonMoonCasketResIgnDesc,
  },
  CrimsonThirst: {
    passive_crit_: CrimsonThirstPassiveDesc,
  },
  CattyLuck: {
    passive_def_: CattyLuckPassiveDesc,
  },
}

/** Conditional-row description override, keyed by wengine + conditional name. */
export const condDescByName: Partial<
  Record<WengineKey, Record<string, WengineDesc>>
> = {
  SolExuvia: {
    eclipse_active: SolExuviaEclipseDesc,
  },
  JoyauDore: {
    wind_ex_stacks: JoyauDoreCondDesc,
  },
  ChiefSidekick: {
    ex_fire_stacks: ChiefSidekickCondDesc,
    offField: ChiefSidekickEnerRegenDesc,
  },
  HalfSugarBunny: {
    activateExtendEtherVeil: HalfSugarBunnyCondDesc,
  },
  StarlightRiderFaceplate: {
    specialUsed: StarlightRiderFaceplateCondDesc,
  },
  NeonFantasies: {
    stacks: NeonFantasiesCondDesc,
  },
  SerpentineSeeker: {
    energyConsumed20: SerpentineSeekerCondDesc,
  },
  FlightOfFancy: {
    etherDmg: FlightOfFancyCondDesc,
  },
  BoisterousEchoes: {
    enemy_with_anomaly: BoisterousEchoesCondDesc,
  },
  WrathfulVajra: {
    exSpecialAssistLaunched: WrathfulVajraCondDesc,
  },
  YesterdayCalls: {
    offField: YesterdayCallsOffFieldDesc,
    physExSpecialUsed: YesterdayCallsCondDesc,
  },
  DreamlitHearth: {
    etherVeilActive: DreamlitHearthCondDesc,
  },
  CloudcleaveRadiance: {
    activatesEtherVeil: CloudcleaveRadianceCondDesc,
  },
  AngelInTheShell: {
    onFieldOrSpecialUsed: AngelInTheShellCondDesc,
  },
  Thoughtbop: {
    offField: ThoughtbopOffFieldDesc,
    physExSpecialUsed: ThoughtbopCondDesc,
  },
  KrakensCradle: {
    hpDecreased: KrakensCradleSheerDesc,
    hpBelow50: KrakensCradleCritDesc,
  },
  CordisGermina: {
    basic_exSpecial_used: CordisGerminaCondDesc,
  },
  BellicoseBlaze: {
    fire_aftershocks: BellicoseBlazeCondDesc,
  },
  Metanukimorphosis: {
    physical_exSpecial_ult: MetanukimorphosisAnomMasDesc,
    aftershock: MetanukimorphosisAftershockDesc,
  },
  OdeOfResurrectedWings: {
    refringe_triggered: OdeOfResurrectedWingsCondDesc,
  },
  QingmingBirdcage: {
    qingmingCompanionStacks: QingmingBirdcageCondDesc,
  },
  PracticedPerfection: {
    stacks: PracticedPerfectionCondDesc,
  },
  RoaringFurnace: {
    chainOrUlt: RoaringFurnaceCondDesc,
  },
  MyriadEclipse: {
    deathSentence: MyriadEclipseCondDesc,
  },
  ElegantVanity: {
    consumed25Energy: ElegantVanityCondDesc,
  },
  BashfulDemon: {
    launch_ex_attack: BashfulDemonCondDesc,
  },
  BunnyBand: {
    wearerShielded: BunnyBandCondDesc,
  },
  DemaraBatteryMarkII: {
    dodgeCounterOrAssistHit: DemaraBatteryMarkIICondDesc,
  },
  FusionCompiler: {
    specialUsed: FusionCompilerCondDesc,
  },
  GrillOWisp: {
    hpDecreased: GrillOWispCondDesc,
  },
  HailstormShrine: {
    exSpecialOrAnomaly: HailstormShrineCondDesc,
  },
  HeartstringNocturne: {
    heartstring: HeartstringNocturneCondDesc,
  },
  OriginalTransmorpher: {
    equipperHit: OriginalTransmorpherCondDesc,
  },
  PeacekeeperSpecialized: {
    shielded: PeacekeeperSpecializedERDesc,
  },
  RiotSuppressorMarkVI: {
    charge: RiotSuppressorMarkVICondDesc,
  },
  SpringEmbrace: {
    when_attacked: SpringEmbraceCondDesc,
  },
  SteelCushion: {
    hit_behind: SteelCushionCondDesc,
  },
  TusksOfFury: {
    interrupt_perfdodge: TusksOfFuryCondDesc,
  },
  ZanshinHerbCase: {
    apply_anom_stun: ZanshinHerbCaseCondDesc,
  },
  Timeweaver: {
    hit_anomaly: TimeweaverCondDesc,
  },
  DeepSeaVisitor: {
    basicHit: DeepSeaVisitorBasicCritDesc,
    iceDashAtkHit: DeepSeaVisitorIceDashCritDesc,
  },
  SeveredInnocence: {
    basicSpecialAftershockHit: SeveredInnocenceCondDesc,
  },
  SpectralGaze: {
    hit_aftershock_electric: SpectralGazeDefRedDesc,
  },
  HellfireGears: {
    offField: HellfireGearsOffFieldDesc,
    exSpecialUsed: HellfireGearsCondDesc,
  },
  KnightsExtolment: {
    battle_edge_stacks: KnightsExtolmentDesc,
  },
  Housekeeper: {
    offField: HousekeeperOffFieldDesc,
    exSpecialHits: HousekeeperExSpecialHitDesc,
  },
  BlazingLaurel: {
    quickOrPerfectAssistUsed: BlazingLaurelAssistImpactDesc,
    wilt: BlazingLaurelWiltDesc,
  },
  FlamemakerShaker: {
    offField: FlamemakerShakerOffFieldDesc,
    exSpecialAssistHits: FlamemakerShakerCondDesc,
  },
  BigCylinder: {
    afterAttacked: BigCylinderDmgDesc,
  },
  WeepingCradle: {
    offField: WeepingCradleOffFieldDesc,
    stacks: WeepingCradleDmgDesc,
  },
  CrimsonMoonCasket: {
    exSpecialWindHit: CrimsonMoonCasketCondDesc,
  },
  CrimsonThirst: {
    exOrMaim: CrimsonThirstCondDesc,
  },
  CattyLuck: {
    exSpecialUsed: CattyLuckCondDesc,
  },
}

/** Wengine-level fallback for conditional descriptions (no condName gate). */
export const condDescFallback: Partial<Record<WengineKey, WengineDesc>> = {
  RoaringRide: RoaringRideDesc,
}

/** Resolve the passive-group description override for (wengine, group fields). */
export function resolvePassiveDescOverride(
  wengineKey: WengineKey,
  tagFields: TagField[],
  phase: number
): ReactNode | undefined {
  if (wengineKey === 'SolExuvia')
    return <GameText text="CRIT Rate increases by 20%." />
  if (
    wengineKey === 'ChiefSidekick' &&
    tagFields.some(
      (f) => f.fieldRef?.name === 'impact' || f.fieldRef?.name === 'fireResIgn_'
    )
  )
    return <ChiefSidekickImpactResDesc phase={phase} />
  const firstFieldName = tagFields[0]?.fieldRef?.name
  if (!firstFieldName) return undefined
  const Desc = passiveDescByField[wengineKey]?.[firstFieldName]
  return Desc ? <Desc phase={phase} /> : undefined
}

/** Resolve the conditional-row description override for (wengine, condName). */
export function resolveCondDescOverride(
  wengineKey: WengineKey,
  condName: string,
  phase: number
): ReactNode | undefined {
  const Desc =
    condDescByName[wengineKey]?.[condName] ?? condDescFallback[wengineKey]
  return Desc ? <Desc phase={phase} /> : undefined
}
