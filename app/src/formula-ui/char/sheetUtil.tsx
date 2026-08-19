import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type { IFormulaData } from '@zenless-optimizer/game-opt/engine'
import { CalcContext, TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type {
  Document,
  UISheetElement,
} from '@zenless-optimizer/game-opt/sheet-ui'
import { read } from '@zenless-optimizer/pando/engine'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { commonDefIcon, mindscapeDefIcon } from '../../assets'
import type { CharacterKey, SkillKey } from '../../consts'
import { allSkillKeys } from '../../consts'
import { useCharacter } from '../../db-ui'
import type { Tag } from '../../formula'
import { buffs, formulas, own } from '../../formula'
import { GameDesc, GameText, i18n } from '../../i18n'
import { getCharStat, mappedStats } from '../../stats'
import { TagDisplay } from '../components'
import { st, trans } from '../util'
import type { CharUISheet } from './consts'
import { getVariant } from './util'

type AddlDocumentsPerSkillAbility = Partial<
  Record<SkillKey, Partial<Record<string, Document[]>>>
>
type AddlDocuments = {
  perSkillAbility?: AddlDocumentsPerSkillAbility
  core?: Document[]
  coreParagraph?: number
  ability?: Document[]
  abilityParagraph?: number
  potential?: Document[]
  m1?: Document[]
  m2?: Document[]
  m3?: Document[]
  m4?: Document[]
  m5?: Document[]
  m6?: Document[]
}

export function hasPotential(characterKey: CharacterKey) {
  return getCharStat(characterKey).potentialParams.length > 0
}

function swapDescToPotential(key18: string) {
  return key18.replace(/\.(desc|params)((?:\.\d+)*)$/, '.$1Potential$2')
}

/**
 * Swaps a trailing `.desc`/`.params` locale key segment to its
 * `.descPotential`/`.paramsPotential` variant when the character has a
 * potential level selected and the variant key exists, e.g.
 * `core.desc.6` → `core.descPotential.6` for potential 1+.
 */
function potentialDescKey(
  characterKey: CharacterKey,
  ns: string,
  key18: string,
  potential: number
) {
  if (potential <= 0 || !hasPotential(characterKey)) return key18
  const swapped = swapDescToPotential(key18)
  if (swapped === key18) return key18
  return i18n.exists(`${ns}:${swapped}`) ? swapped : key18
}

function usePotentialDescKey(
  characterKey: CharacterKey,
  ns: string,
  key18: string
) {
  const char = useCharacter(characterKey)
  return potentialDescKey(characterKey, ns, key18, char?.potential ?? 0)
}

export { usePotentialDescKey }

/**
 * Ability description body text, dimmed when the ability trigger condition
 * is not met. Uses `useCharacter` for the potential-desc-key swap so it
 * works as a plain ReactNode (no calc callback needed).
 */
function AbilityDescBody({
  charKey,
  abilityParagraph,
}: {
  charKey: CharacterKey
  abilityParagraph?: number
}) {
  const [chg] = trans('char', charKey)
  const key18 = usePotentialDescKey(
    charKey,
    `char_${charKey}_gen`,
    `ability.desc${abilityParagraph !== undefined ? `.${abilityParagraph}` : ''}`
  )
  return <AbilityBodyText characterKey={charKey}>{chg(key18)}</AbilityBodyText>
}

/**
 * Whether the character's Additional Ability trigger condition is currently
 * met, determined by checking if any `ability_*` buff is non-zero.
 */
export function useAbilityActive(characterKey: CharacterKey): boolean {
  const calc = useContext(CalcContext)
  const contextTag = useContext(TagContext)
  return useMemo(() => {
    if (!calc) return true
    const charBuffs = (buffs as any)[characterKey] as
      | Record<string, { tag?: Tag }>
      | undefined
    if (!charBuffs) return true
    const tag = { ...contextTag, src: characterKey } as Tag
    return Object.entries(charBuffs)
      .filter(([name]) => name.startsWith('ability_'))
      .some(([, b]) => {
        const t = b?.tag
        if (!t) return false
        return calc.withTag(tag).compute(read(t)).val > 0
      })
  }, [calc, contextTag, characterKey])
}

/** Renders Additional Ability body text, dimmed while the ability is inactive. */
export function AbilityBodyText({
  characterKey,
  children,
}: {
  characterKey: CharacterKey
  children: ReactNode
}) {
  const active = useAbilityActive(characterKey)
  return (
    <div style={{ marginTop: 8, opacity: active ? undefined : 0.5 }}>
      {children}
    </div>
  )
}

// Creates the base sheet for a character, including all skill dmg, daze and anom values
export function createBaseSheet(
  key: CharacterKey,
  addlDocuments: AddlDocuments = {}
): CharUISheet {
  const hasPotential = getCharStat(key).potentialParams.length > 0

  return {
    ...createSkillsSheets(key, addlDocuments?.perSkillAbility),
    core: createCoreAndAbilitySheet(
      key,
      addlDocuments?.core,
      addlDocuments?.ability,
      addlDocuments?.abilityParagraph,
      addlDocuments?.coreParagraph
    ),
    ...(hasPotential
      ? { potential: createPotentialSheet(key, addlDocuments?.potential) }
      : {}),
    m1: createMindscapeSheet(key, 1, addlDocuments?.m1),
    m2: createMindscapeSheet(key, 2, addlDocuments?.m2),
    m3: createMindscapeSheet(key, 3, addlDocuments?.m3),
    m4: createMindscapeSheet(key, 4, addlDocuments?.m4),
    m5: createMindscapeSheet(key, 5, addlDocuments?.m5),
    m6: createMindscapeSheet(key, 6, addlDocuments?.m6),
  }
}

// Creates proper field with automatic title for a given buff
export function fieldForBuff(buff: IFormulaData<Tag>) {
  return {
    title: <TagDisplay tag={buff.tag} preventRecursion />,
    fieldRef: buff.tag,
    ...(buff.team !== undefined ? { team: buff.team } : {}),
  }
}

function fieldForSkillFormula(
  charKey: CharacterKey,
  skill: SkillKey,
  formula: IFormulaData<Tag>
) {
  return {
    title: (
      <ColorText color={getVariant(formula.tag)}>
        {abilityFormulaNameToTranslated(charKey, skill, formula.name)}
      </ColorText>
    ),
    fieldRef: formula.tag,
  }
}

// Renders a skill ability description with the potential variant when the
// character has a potential level selected
function SkillAbilityDesc({
  characterKey,
  skill,
  ability,
}: {
  characterKey: CharacterKey
  skill: SkillKey
  ability: string
}) {
  const ns = `char_${characterKey}_gen`
  const key18 = usePotentialDescKey(
    characterKey,
    ns,
    `${skill}.${ability}.desc`
  )
  return <GameDesc ns={ns} key18={key18} />
}

function createSkillsSheets(
  charKey: CharacterKey,
  addlDocumentsPerSkillAbility?: AddlDocumentsPerSkillAbility
) {
  const dm = mappedStats.char[charKey]
  if (!dm) {
    console.error('mappedStats.char[' + charKey + '] is undefined')
    return {} as any
  }
  const form = formulas[charKey]
  if (!form) {
    console.error('formulas[' + charKey + '] is undefined')
    return {} as any
  }
  const [chg, _ch] = trans('char', charKey)
  return objKeyMap(
    allSkillKeys,
    (skill): UISheetElement => ({
      title: skill, // TODO: Translate. Though this doesn't seem to be shown anywhere
      img: commonDefIcon(`${skill}Flat`),
      documents: Object.keys(dm[skill]).flatMap((ability): Document[] => [
        {
          type: 'text',
          header: {
            icon: <ImgIcon src={commonDefIcon(`${skill}Flat`)} size={1.5} />,
            text: chg(`${skill}.${ability}.name`),
          },
          text: (
            <SkillAbilityDesc
              characterKey={charKey}
              skill={skill}
              ability={ability}
            />
          ),
        },
        {
          type: 'fields',
          fields: Object.values(form)
            .filter((f: any) => f.name.split('_')[0] === ability)
            .map((f: any) => fieldForSkillFormula(charKey, skill, f)),
        },
        ...(addlDocumentsPerSkillAbility?.[skill]?.[ability] ?? []),
      ]),
    })
  )
}

function abilityFormulaNameToTranslated(
  charKey: CharacterKey,
  skill: SkillKey,
  abilityFormulaName: string
) {
  const [ability, hitNumber, type] = abilityFormulaName.split('_')
  const hitIdx = hitNumber.replace(/\D/g, '')
  return (
    <FormulaNameSpan
      charKey={charKey}
      skill={skill}
      ability={ability}
      hitIdx={hitIdx}
      type={type}
    />
  )
}

/**
 * Renders a formula name (e.g. "BasicAttackSweepingEdge_0_dmg") using the
 * ability's i18n name and a 1-indexed hit number.
 */
function FormulaNameSpan({
  charKey,
  skill,
  ability,
  hitIdx,
  type,
}: {
  charKey: CharacterKey
  skill: SkillKey
  ability: string
  hitIdx: string
  type: string
}) {
  const ns = `char_${charKey}_gen`
  const abilityNameKey = `${ns}:${skill}.${ability}.name`
  const abilityName = i18n.exists(abilityNameKey)
    ? i18n.t(abilityNameKey)
    : ability
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        // Don't split ordinal suffixes like "1st" into "1 st"
        .replace(/(\d)(?!st|nd|rd|th)([a-zA-Z])/gi, '$1 $2')
        .trim()
  if (hitIdx) {
    const hitNum = Number(hitIdx) + 1 // 0-indexed → 1-indexed for user display
    return st(type, { val: `${abilityName} #${hitNum} ` })
  }
  return st(type, { val: `${abilityName} ` })
}

function createCoreAndAbilitySheet(
  charKey: CharacterKey,
  addlCoreDocuments: Document[] = [],
  addlAbilityDocuments: Document[] = [],
  abilityParagraph?: number,
  coreParagraph?: number
): UISheetElement {
  const [chg, _ch] = trans('char', charKey)
  return {
    title: 'core',
    documents: [
      {
        type: 'text',
        header: {
          icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
          text: chg('core.name'),
        },
        text: (calc) => {
          const coreKey = `core.desc.${calc.compute(own.char.core).val}${
            coreParagraph !== undefined ? `.${coreParagraph}` : ''
          }`
          return chg(
            potentialDescKey(
              charKey,
              `char_${charKey}_gen`,
              coreKey,
              calc.compute(own.char.potential).val
            )
          )
        },
      },
      ...addlCoreDocuments,
      {
        type: 'text',
        header: {
          icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
          text: chg('ability.name'),
        },
        text: (
          <AbilityDescBody
            charKey={charKey}
            abilityParagraph={abilityParagraph}
          />
        ),
      },
      ...addlAbilityDocuments,
    ],
  }
}

function createMindscapeSheet(
  charKey: CharacterKey,
  mindscape: 1 | 2 | 3 | 4 | 5 | 6,
  addlDocuments: Document[] = []
): UISheetElement {
  const [chg, _ch] = trans('char', charKey)
  return {
    title: `mindscape${mindscape}`,
    documents: [
      {
        type: 'text',
        header: {
          icon: <ImgIcon src={mindscapeDefIcon(mindscape)} size={1.5} />,
          text: chg(`mindscapes.${mindscape}.name`),
        },
        text: (
          <>
            {chg(`mindscapes.${mindscape}.desc`)}
            <br />
            <br />
            <i>{chg(`mindscapes.${mindscape}.flavor`)}</i>
          </>
        ),
      },
      ...addlDocuments,
    ],
  }
}

function createPotentialSheet(
  charKey: CharacterKey,
  addlPotentialDocuments: Document[] = []
): UISheetElement {
  const [chg, _ch] = trans('char', charKey)
  return {
    title: 'potential',
    documents: [
      {
        type: 'text',
        header: {
          icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
          text: chg(`potential.name`),
        },
        text: (calc) =>
          chg(`potential.desc.${calc.compute(own.char.potential).val}`),
      },
      ...addlPotentialDocuments,
    ],
  }
}

/**
 * Renders a core passive description using the character's actual core level,
 * so the displayed values match the level the character has unlocked rather
 * than always showing base level 0 values.
 *
 * Uses `useCharacter(characterKey)` to look up the specific character's data,
 * so it works correctly for both the main character and teammates (unlike
 * `useCharacterContext()` which always returns the main character).
 *
 * @param characterKey - The character's key (used to construct both the ns and the db lookup)
 * @param paragraph - Optional paragraph index within the core level's desc.
 *   Omit to render all paragraphs for the core level.
 */
const avatarSkillLevelIndexing = [
  'basic',
  'special',
  'dodge',
  'chain',
  'assist',
] as const

const CAL_RE = /\{CAL:([^,]+),(\d+),(\d+)\}/g

function evalCalcExpr(
  expr: string,
  skillLevels: Record<string, number>
): number {
  const normalized = expr.replace(
    /AvatarSkillLevel\((\d+)\)/g,
    (_, idx) => avatarSkillLevelIndexing[parseInt(idx)] ?? '0'
  )

  const fn = new Function(...avatarSkillLevelIndexing, `return ${normalized}`)
  return fn(...avatarSkillLevelIndexing.map((k) => skillLevels[k] ?? 1))
}

function processCalcTokens(
  text: string,
  skillLevels: Record<string, number>
): string {
  return text.replace(CAL_RE, (_match, expr, multStr, decStr) => {
    const val = evalCalcExpr(expr, skillLevels)
    const mult = parseInt(multStr)
    const dec = parseInt(decStr)
    return (val * mult).toFixed(dec)
  })
}

export function CoreGameDesc({
  characterKey,
  paragraph,
}: {
  characterKey: CharacterKey
  paragraph?: number
}) {
  const char = useCharacter(characterKey)
  const coreLevel = char?.core ?? 0
  const suffix = paragraph !== undefined ? `.${paragraph}` : ''
  const ns = `char_${characterKey}_gen`
  const key18 = usePotentialDescKey(
    characterKey,
    ns,
    `core.desc.${coreLevel}${suffix}`
  )
  return <GameDesc ns={ns} key18={key18} />
}

/**
 * Renders a locale description with `{CAL:...}` tokens evaluated using
 * the character's actual skill levels.
 */
export function SkillGameDesc({
  characterKey,
  ns,
  key18,
  paragraph,
}: {
  characterKey: CharacterKey
  ns: string
  key18: string
  paragraph?: number
}) {
  const char = useCharacter(characterKey)
  const key18Potential = usePotentialDescKey(characterKey, ns, key18)
  const skillLevels = useMemo(() => {
    const base = {
      basic: char?.basic ?? 1,
      dodge: char?.dodge ?? 1,
      special: char?.special ?? 1,
      chain: char?.chain ?? 1,
      assist: char?.assist ?? 1,
    }
    const ms = char?.mindscape ?? 0
    // M3 and M5 each give +2 to all skill levels
    if (ms >= 3) {
      base.basic += 2
      base.dodge += 2
      base.assist += 2
      base.special += 2
      base.chain += 2
    }
    if (ms >= 5) {
      base.basic += 2
      base.dodge += 2
      base.assist += 2
      base.special += 2
      base.chain += 2
    }
    return base
  }, [
    char?.basic,
    char?.dodge,
    char?.special,
    char?.chain,
    char?.assist,
    char?.mindscape,
  ])
  const { t } = useTranslation(ns)
  const textKey = `${ns}:${key18Potential}`
  const obj = t(textKey, { returnObjects: true })
  const processedStr = useMemo(
    () =>
      typeof obj === 'string' ? processCalcTokens(obj, skillLevels) : null,
    [obj, skillLevels]
  )
  if (typeof obj === 'string') return <GameText text={processedStr!} />
  const paragraphs = Object.values(obj as Record<string, string>).filter(
    (v): v is string => typeof v === 'string'
  )
  const filteredParagraphs =
    paragraph !== undefined
      ? paragraphs.slice(paragraph, paragraph + 1)
      : paragraphs
  return (
    <>
      {filteredParagraphs.map((para, i) => {
        const processed = processCalcTokens(para, skillLevels)
        return (
          <div
            key={i}
            style={{
              marginBottom: i < filteredParagraphs.length - 1 ? 8 : 0,
            }}
          >
            <GameText text={processed} />
          </div>
        )
      })}
    </>
  )
}

/**
 * Effective mindscape used for display dimming. Provided by views that know
 * the character's effective mindscape (e.g. the teammate card, where the
 * teammate override takes precedence over the character DB value).
 */
export const EffectiveMindscapeContext = createContext<number | undefined>(
  undefined
)

export function useEffectiveMindscape(characterKey: CharacterKey): number {
  const effectiveMindscape = useContext(EffectiveMindscapeContext)
  const character = useCharacter(characterKey)
  return effectiveMindscape ?? character?.mindscape ?? 0
}

/**
 * Renders a description line prefixed with a label (e.g. "P1", "M4"),
 * dimmed when the required gate (potential/mindscape level) is not met.
 * Shared so future character sheets reuse the same dimmed-line pattern.
 */
export function PrefixedLine({
  prefix,
  dimmed,
  children,
}: {
  prefix: string
  dimmed: boolean
  children: ReactNode
}) {
  return (
    <div style={{ marginTop: 8, ...(dimmed ? { opacity: 0.5 } : {}) }}>
      {prefix}: {children}
    </div>
  )
}
