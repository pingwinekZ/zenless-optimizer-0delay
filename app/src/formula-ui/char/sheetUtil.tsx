import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type { IFormulaData } from '@zenless-optimizer/game-opt/engine'
import type {
  Document,
  UISheetElement,
} from '@zenless-optimizer/game-opt/sheet-ui'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { commonDefIcon, mindscapeDefIcon } from '../../assets'
import type { CharacterKey, SkillKey } from '../../consts'
import { allSkillKeys } from '../../consts'
import { useCharacter } from '../../db-ui'
import type { Tag } from '../../formula'
import { formulas, own } from '../../formula'
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
          text: chg(`${skill}.${ability}.desc`),
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
        text: (calc) =>
          coreParagraph !== undefined
            ? chg(
                `core.desc.${calc.compute(own.char.core).val}.${coreParagraph}`
              )
            : chg(`core.desc.${calc.compute(own.char.core).val}`),
      },
      ...addlCoreDocuments,
      {
        type: 'text',
        header: {
          icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
          text: chg('ability.name'),
        },
        text:
          abilityParagraph !== undefined
            ? chg(`ability.desc.${abilityParagraph}`)
            : chg('ability.desc'),
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
  return (
    <GameDesc
      ns={`char_${characterKey}_gen`}
      key18={`core.desc.${coreLevel}${suffix}`}
    />
  )
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
  const textKey = `${ns}:${key18}`
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
