import type { AttributeKey, SpecialityKey } from '../consts'
import type { BonusStatTag, EnemyStatsTag } from '../db'

export type BuffBonusStat = {
  tag: BonusStatTag
  value: number
  specialty?: SpecialityKey
  conditional?: boolean
}
export type BuffEnemyStat = {
  tag: EnemyStatsTag
  value: number
  specialty?: SpecialityKey
  conditional?: boolean
}
export type BuffConfig = {
  bonusStats: BuffBonusStat[]
  enemyStats: BuffEnemyStat[]
}

// Maps text keywords → BonusStatKey
const statKeywords: Record<string, string> = {
  ATK: 'atk_',
  'CRIT Rate': 'crit_',
  'CRIT DMG': 'crit_dmg_',
  HP: 'hp_',
  'Max HP': 'hp_',
  'Sheer DMG': 'sheer_dmg_',
  'Anomaly Proficiency': 'anomProf',
  Impact: 'impact_',
  'Daze dealt': 'dazeInc_',
  Daze: 'dazeInc_',
  'Anomaly Buildup': 'anomMas_',
  'Chain Attack DMG': 'dmg_',
  'Chain Attacks DMG': 'dmg_',
  'Ultimate DMG': 'dmg_',
  'EX Special Attack DMG': 'dmg_',
  'Basic Attack DMG': 'dmg_',
  'Dodge Counter DMG': 'dmg_',
  'Dash Attack DMG': 'dmg_',
  'Quick Assist DMG': 'dmg_',
  'Aftershock DMG': 'dmg_',
  'Abloom DMG': 'dmg_',
  'Disorder DMG': 'dmg_',
  'Vortex DMG': 'dmg_',
  'Attribute Anomaly DMG': 'dmg_',
  'Stun DMG Multiplier': 'stun_',
  'initial Energy': 'enerRegen_',
}

// Stats that use percentage values
const percentageStats = new Set([
  'atk_',
  'crit_',
  'crit_dmg_',
  'hp_',
  'dmg_',
  'sheer_dmg_',
  'impact_',
  'dazeInc_',
  'anomMas_',
  'enerRegen_',
  'stun_',
  'defIgn_',
  'resIgn_',
])

// Text keywords → AttributeKey
const attributeKeywords: Record<string, AttributeKey> = {
  Ice: 'ice',
  Fire: 'fire',
  Electric: 'electric',
  Ether: 'ether',
  Physical: 'physical',
  Wind: 'wind',
}

// Text keywords → BonusStatDamageType
const damageTypeKeywords: Record<string, string> = {
  'Basic Attack': 'basic',
  'Dash Attack': 'dash',
  'Dodge Counter': 'dodgeCounter',
  'Special Attack': 'special',
  'EX Special Attack': 'exSpecial',
  'Chain Attack': 'chain',
  Ultimate: 'ult',
  'Quick Assist': 'quickAssist',
  Aftershock: 'aftershock',
  Disorder: 'disorder',
  Abloom: 'abloom',
  Vortex: 'vortex',
  'Attribute Anomaly': 'anomaly',
}

// Specialty text → SpecialityKey
const specialtyKeywords: Record<string, SpecialityKey> = {
  Attack: 'attack',
  Stun: 'stun',
  Anomaly: 'anomaly',
  Support: 'support',
  Defense: 'defense',
  Rupture: 'rupture',
}

function matchAttribute(text: string): AttributeKey | undefined {
  for (const [kw, key] of Object.entries(attributeKeywords)) {
    if (text.includes(kw)) return key
  }
  return undefined
}

function matchDamageType(text: string): string | undefined {
  // Sort by key length descending so "EX Special Attack" matches before "Special Attack"
  const sorted = Object.entries(damageTypeKeywords).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [kw, key] of sorted) {
    if (text.includes(kw)) return key
  }
  return undefined
}

function matchSpecialty(text: string): SpecialityKey | undefined {
  for (const [kw, key] of Object.entries(specialtyKeywords)) {
    if (text.includes(kw)) return key
  }
  return undefined
}

function isConditional(text: string): boolean {
  return /^(When |After |While |Upon |If )/.test(text.trim())
}

/**
 * Extract all damage type keywords found in text (case-insensitive).
 * Handles pluralized forms like "Ultimates", "EX Special Attacks", etc.
 * Uses longest-first matching to avoid substring false positives
 * (e.g. "Special Attack" matching within "EX Special Attack").
 */
function extractDamageTypes(text: string): string[] {
  // Sort by key length descending so longer keywords match first
  const entries = Object.entries(damageTypeKeywords).sort(
    (a, b) => b[0].length - a[0].length
  )

  const types: string[] = []
  const usedRanges: Array<[number, number]> = []

  for (const [kw, key] of entries) {
    // Check exact keyword
    const idx = text.indexOf(kw)
    if (idx !== -1) {
      const end = idx + kw.length
      const overlaps = usedRanges.some(([s, e]) => idx < e && end > s)
      if (!overlaps) {
        types.push(key)
        usedRanges.push([idx, end])
      }
      continue
    }

    // Check plural forms
    let plural = ''
    if (kw.endsWith('e')) plural = `${kw}s`
    else if (kw.endsWith('y')) plural = `${kw.slice(0, -1)}ies`
    else plural = `${kw}s`

    const pidx = text.indexOf(plural)
    if (pidx !== -1) {
      const end = pidx + plural.length
      const overlaps = usedRanges.some(([s, e]) => pidx < e && end > s)
      if (!overlaps) {
        types.push(key)
        usedRanges.push([pidx, end])
      }
    }
  }

  return types
}

/**
 * Sentence-level pre-pass: detect and extract ignore/DEF-ign patterns that
 * have damage type qualifiers (e.g. "Basic Attack, EX Special Attack, and
 * Ultimate ignore 10% of enemy Physical RES").
 *
 * Must run BEFORE comma/and splitting, which would destroy the damage type
 * list context.
 *
 * Returns the sentence with the matched ignore clause removed so the
 * remaining text can be processed normally without double-counting.
 */
function extractTypedIgnore(
  sentence: string,
  bonusStats: BuffBonusStat[],
  conditional: boolean,
  specialty: SpecialityKey | undefined
): string {
  // Match "...<text> ignore[sd]? N% of [the] [enemy's] [all-DMG/attribute] RES/DEF [...]"
  // or "...<text> ignore[sd]? N% of [the] [enemy's] [attribute] RES [...]"
  // Captures: (1) value, (2) RES or DEF, optional (3) attribute name before RES
  const ignoreRe =
    /(\s(?:,?\s*and\s+|,\s*|as\s+well\s+as\s+|or\s+))?ignor(?:e[sd]?|ing)\s+(\d+)%\s+of\s+(?:the\s+)?(?:enem(?:y|ies)'?s?\s+)?(?:(\w+)\s+)?(?:all[- ]?(?:DMG|attribute)\s+)?(RES|DEF)\b/i

  const match = sentence.match(ignoreRe)
  if (!match) return sentence

  const value = Number(match[2])
  const statType: BonusStatTag['q'] =
    match[4].toUpperCase() === 'RES' ? 'resIgn_' : 'defIgn_'
  const attr = match[3] ? matchAttribute(match[3]) : undefined

  // Extract damage types from everything before the "ignore" clause
  const ignoreStart = sentence.indexOf(match[0])
  const beforeIgnore = sentence.substring(0, ignoreStart)
  const dmgTypes = extractDamageTypes(beforeIgnore)
  const attrs: (AttributeKey | undefined)[] = [attr]

  // Check for "and <Attr> RES/DEF" after the first match
  const afterMatch = sentence.substring(ignoreStart + match[0].length)
  const extraAttrRe = /and\s+(\w+)\s+(?:RES|DEF)\b/i
  let extraAttrMatch: RegExpExecArray | null
  let searchPos = 0
  while ((extraAttrMatch = extraAttrRe.exec(afterMatch.substring(searchPos)))) {
    const extraAttr = matchAttribute(extraAttrMatch[1])
    if (extraAttr) attrs.push(extraAttr)
    searchPos += extraAttrMatch.index + extraAttrMatch[0].length
  }

  if (dmgTypes.length > 0) {
    for (const attr of attrs) {
      for (const dmgType of dmgTypes) {
        bonusStats.push({
          tag: {
            q: statType,
            qt: 'combat',
            ...(attr && { attribute: attr }),
            damageType1: dmgType as BonusStatTag['damageType1'],
          },
          value,
          ...(conditional && { conditional: true }),
          ...(specialty && { specialty }),
        })
      }
    }
    // Remove the ignore clause from the sentence to avoid double-processing
    return (
      sentence.substring(0, ignoreStart) +
      sentence.substring(ignoreStart + match[0].length)
    )
  }

  return sentence
}

/**
 * Sentence-level pre-pass: detect lists of <Attribute> DMG keywords followed
 * by "increase(s) by N%" (e.g. "Electric DMG and Physical DMG increase by 20%").
 *
 * Must run BEFORE comma/and splitting, which would destroy the list context.
 *
 * Returns the sentence with the matched DMG clause removed.
 */
function extractAttrDmgList(
  sentence: string,
  bonusStats: BuffBonusStat[],
  conditional: boolean,
  specialty: SpecialityKey | undefined
): string {
  // Match "increase(s) by N%" or "is/are increased by N%" at the end of a clause
  const incMatch = sentence.match(
    /(?:<[^>]+>)?(?:is\s+|are\s+)?increas\w*\s+by\s+(\d+)%/i
  )
  if (!incMatch) return sentence

  const incIdx = sentence.indexOf(incMatch[0])
  const beforeInc = sentence.substring(0, incIdx)
  const value = Number(incMatch[1])

  // Extract all "<Attribute> DMG" mentions from text before "increase"
  const attrs: AttributeKey[] = []
  const attrRe = /(\w+)\s+DMG/gi
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(beforeInc))) {
    const attr = matchAttribute(m[1])
    if (attr) attrs.push(attr)
  }

  if (attrs.length > 0) {
    for (const attr of attrs) {
      bonusStats.push({
        tag: { q: 'dmg_', qt: 'combat', attribute: attr },
        value,
        ...(conditional && { conditional: true }),
        ...(specialty && { specialty }),
      })
    }
    // Remove the matched portion from the sentence
    return sentence.replace(beforeInc + incMatch[0], '').trim()
  }

  return sentence
}

/**
 * Sentence-level pre-pass: detect damage-type-qualified "deal N% increased/more DMG"
 * patterns with damage type lists (e.g. "Basic Attack, EX Special Attack, and Ultimate
 * deal 20% increased DMG").
 *
 * Must run BEFORE comma/and splitting, which would destroy the damage type list context.
 *
 * Returns the sentence with the matched DMG clause removed.
 */
function extractTypedDmgIncrease(
  sentence: string,
  bonusStats: BuffBonusStat[],
  conditional: boolean,
  specialty: SpecialityKey | undefined
): string {
  // Match "<DMG type list> deal(s) N% (increased|more) DMG"
  const dealMatch = sentence.match(
    /(\w[\w\s,]*?)\s+deal(?:s|ing)?\s+(\d+)%\s+(?:increased|more)\s+DMG/i
  )
  if (dealMatch) {
    const dmgListPart = dealMatch[1]
    const value = Number(dealMatch[2])
    const dmgTypes = extractDamageTypes(dmgListPart)

    if (dmgTypes.length > 0) {
      for (const dmgType of dmgTypes) {
        bonusStats.push({
          tag: {
            q: 'dmg_',
            qt: 'combat',
            damageType1: dmgType as BonusStatTag['damageType1'],
          },
          value,
          ...(conditional && { conditional: true }),
          ...(specialty && { specialty }),
        })
      }
      return sentence.replace(dealMatch[0], '').trim()
    }
  }

  // Match "DMG is/are increased by N%" or "DMG increases by N%"
  // Also handles "DMG dealt by <types> increases by N%" where types appear
  // between "DMG" and "increases" rather than before "DMG".
  const dmgIncMatch = sentence.match(
    /DMG\s+(?:<[^>]+>)?(?:is\s+|are\s+)?.*?increas\w*\s+by\s+(\d+)%/i
  )
  if (dmgIncMatch) {
    const fullMatch = dmgIncMatch[0]
    const dmgIdx = sentence.indexOf(fullMatch)
    const beforeDmg = sentence.substring(0, dmgIdx).trim()
    const value = Number(dmgIncMatch[1])

    // Extract text between "DMG" and "increases" for damage type lookup
    const afterDmg = fullMatch.substring(3)
    const incrIdx = afterDmg.search(/increas\w*/i)
    const betweenText = afterDmg.substring(0, incrIdx).trim()

    // Check if the word immediately before "DMG" is a damage type keyword
    // (to avoid false matches on stat keywords like "CRIT DMG")
    const lastWord = beforeDmg.split(/[\s,]+/).pop() ?? ''
    const dmgTypes = matchDamageType(lastWord)
      ? extractDamageTypes(beforeDmg)
      : extractDamageTypes(betweenText)

    if (dmgTypes.length > 0) {
      for (const dmgType of dmgTypes) {
        bonusStats.push({
          tag: {
            q: 'dmg_',
            qt: 'combat',
            damageType1: dmgType as BonusStatTag['damageType1'],
          },
          value,
          ...(conditional && { conditional: true }),
          ...(specialty && { specialty }),
        })
      }
      return (
        sentence.substring(0, dmgIdx) +
        sentence.substring(dmgIdx + fullMatch.length)
      ).trim()
    }

    // Generic "DMG … increases by N%" with no specific damage type
    if (beforeDmg === '') {
      bonusStats.push({
        tag: { q: 'dmg_', qt: 'combat' },
        value,
        ...(conditional && { conditional: true }),
        ...(specialty && { specialty }),
      })
      return (
        sentence.substring(0, dmgIdx) +
        sentence.substring(dmgIdx + fullMatch.length)
      ).trim()
    }
  }

  return sentence
}

/**
 * Parse buff description text into structured stat effects.
 *
 * Handles the rich-text format used in DA/Shiyu season JSON:
 *   `<color=#HEX>text</color>` tags, `·` bullet points, percentage/flat values.
 */
export function parseBuffDescription(desc: string): BuffConfig {
  const bonusStats: BuffBonusStat[] = []
  const enemyStats: BuffEnemyStat[] = []

  // Strip HTML color tags
  const stripped = desc
    .replace(/<color=#[A-Fa-f0-9]{6}>/g, '')
    .replace(/<\/color>/g, '')

  // Split by bullet points
  const bullets = stripped
    .split(/·/)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const bullet of bullets) {
    // Split each bullet into sentences by period
    const sentences = bullet
      .split(/\./)
      .map((s) => s.trim())
      .filter(Boolean)

    // Track specialty across sentences within the same bullet.
    // When a sentence explicitly mentions a specialty (e.g. "Agents with Attack specialty"),
    // subsequent sentences that refer back (e.g. "Their Basic Attack DMG...") inherit it.
    let bulletSpecialty: SpecialityKey | undefined

    for (const sentence of sentences) {
      // Detect specialty condition at sentence level
      const sentSpecialtyMatch = sentence.match(
        /(?:for (?:Agents? )?(?:with|of) )(\w+) specialty|(?:with|of) (?:the )?(\w+) specialty|(\w+) specialty Agents?/i
      )
      const sentSpecialty = sentSpecialtyMatch
        ? matchSpecialty(
            sentSpecialtyMatch[1] ??
              sentSpecialtyMatch[2] ??
              sentSpecialtyMatch[3]
          )
        : undefined
      // Update bullet-level specialty if this sentence has an explicit one
      if (sentSpecialty) bulletSpecialty = sentSpecialty
      // Use bullet-level specialty as fallback for sentences that don't re-state it
      const effectiveSpecialty = sentSpecialty ?? bulletSpecialty

      // Detect stack multiplier: "stacking up to N times"
      const stackMatch = sentence.match(/stacking\s+up\s+to\s+(\d+)\s+times/i)
      const stackMult = stackMatch ? Number(stackMatch[1]) : 1

      // Track how many bonus/enemy stats existed before this sentence
      // so we can apply stack multiplier to sentence-local stats
      const bonusStatsBefore = bonusStats.length
      const enemyStatsBefore = enemyStats.length

      // Pre-pass: extract damage-type-qualified ignore patterns before
      // comma/and splitting destroys the damage type list context
      let processedSentence = extractTypedIgnore(
        sentence,
        bonusStats,
        false,
        effectiveSpecialty
      )

      // Pre-pass: extract damage-type-qualified "deal N% increased DMG" patterns
      processedSentence = extractTypedDmgIncrease(
        processedSentence,
        bonusStats,
        false,
        effectiveSpecialty
      )

      // Pre-pass: extract <Attribute> DMG lists (e.g. "Electric DMG and Physical DMG increase by 20%")
      processedSentence = extractAttrDmgList(
        processedSentence,
        bonusStats,
        false,
        effectiveSpecialty
      )

      // Split by commas and conjunctions to isolate individual effects
      const segments = processedSentence
        .split(/,|(?: and )|(?:; )/)
        .map((s) => s.trim())
        .filter(Boolean)

      for (const seg of segments) {
        // Skip sentences that are purely conditional without a stat effect
        if (/^(When |After |While |Upon |If )/.test(seg) && !/[+]?\d/.test(seg))
          continue

        // Skip Anomaly Buildup Rate — not mappable as a standalone stat
        if (/Anomaly Buildup Rate/i.test(seg)) continue

        const conditional = isConditional(seg)

        // Detect specialty condition from "For Agents with/of X specialty" or "Agents with X specialty" patterns
        const specialtyMatch = seg.match(
          /(?:for (?:Agents? )?(?:with|of) |Agents? (?:with|of) )(\w+) specialty|(\w+) specialty Agents?/i
        )
        const segmentSpecialty = specialtyMatch
          ? matchSpecialty(specialtyMatch[1] ?? specialtyMatch[2])
          : undefined
        // Fall back to sentence/bullet-level specialty if segment doesn't have its own
        // (e.g. "Their Basic Attack DMG..." continuing from "Agents with Attack specialty")
        const specialty = segmentSpecialty ?? effectiveSpecialty

        // --- Defense/RES ignore (must check before generic stat patterns) ---
        const defIgnMatch = seg.match(
          /ignor(?:e|ing)\s+(\d+)%\s+of\s+(?:the\s+)?(?:enem(?:y|ies)'?s?\s+)?(?:all[- ]?(?:DMG|attribute)\s+)?DEF/i
        )
        if (defIgnMatch) {
          bonusStats.push({
            tag: { q: 'defIgn_', qt: 'combat' },
            value: Number(defIgnMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        const resIgnMatch = seg.match(
          /ignor(?:e|ing)\s+(\d+)%\s+of\s+(?:the\s+)?(?:enem(?:y|ies)'?s?\s+)?(?:all[- ]?(?:DMG|attribute)\s+)?RES/i
        )
        if (resIgnMatch) {
          const attr = matchAttribute(seg)
          bonusStats.push({
            tag: {
              q: 'resIgn_',
              qt: 'combat',
              ...(attr && { attribute: attr }),
            },
            value: Number(resIgnMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // Also handle "ignore N% of the target's All-DMG RES"
        const resIgnMatch2 = seg.match(
          /ignor(?:e|ing)\s+(\d+)%\s+of\s+(?:the\s+)?(?:target'?s?\s+)All[- ]DMG\s+RES/i
        )
        if (resIgnMatch2) {
          bonusStats.push({
            tag: { q: 'resIgn_', qt: 'combat' },
            value: Number(resIgnMatch2[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // --- Check for "ignore N% of enemy [Attribute] RES" ---
        const attrResIgnMatch = seg.match(
          /ignor(?:e[sd]?|ing)\s+(\d+)%\s+of\s+(?:the\s+)?(?:enem(?:y|ies)'?s?\s+)?(\w+)\s+RES/i
        )
        if (attrResIgnMatch) {
          const attr = matchAttribute(attrResIgnMatch[2])
          if (attr) {
            bonusStats.push({
              tag: { q: 'resIgn_', qt: 'combat', attribute: attr },
              value: Number(attrResIgnMatch[1]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // --- "decreases by N%" (enemy stat reductions) ---
        const decMatch = seg.match(
          /(?:enem(?:y|ies)'?s?|their|the)\s+(.+?)\s+decreases?\s+by\s+(\d+)%/i
        )
        if (decMatch) {
          const enemyStatName = decMatch[1]
          const value = Number(decMatch[2])

          if (/Stun recovery speed/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'unstun_' },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }

          if (/All[- ]?Attribute\s+RES/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'resRed_' },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }

          const decAttr = matchAttribute(enemyStatName)
          if (decAttr && /RES/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'resRed_', attribute: decAttr },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }

          if (/DEF/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'defRed_' },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // --- "drops by N%" (enemy RES reduction) ---
        const dropMatch = seg.match(
          /(?:enem(?:y|ies)'?s?|their)\s+(\w+)\s+RES\s+drops?\s+by\s+(\d+)%/i
        )
        if (dropMatch) {
          const attr = matchAttribute(dropMatch[1])
          if (attr) {
            enemyStats.push({
              tag: { q: 'resRed_', attribute: attr },
              value: Number(dropMatch[2]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // --- "drops by N%" for DEF (e.g. "enemy DEF drops by 10%") ---
        const defDropMatch = seg.match(
          /(?:enem(?:y|ies)'?s?|their)\s+DEF\s+drops?\s+by\s+(\d+)%/i
        )
        if (defDropMatch) {
          enemyStats.push({
            tag: { q: 'defRed_' },
            value: Number(defDropMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // --- "is reduced by N%" (enemy stat reduction) ---
        const reducedMatch = seg.match(
          /(?:enem(?:y|ies)'?s?|their)\s+(.+?)\s+is\s+reduced\s+by\s+(\d+)%/i
        )
        if (reducedMatch) {
          const enemyStatName = reducedMatch[1]
          const value = Number(reducedMatch[2])

          if (/All[- ]?Attribute\s+RES/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'resRed_' },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }

          const redAttr = matchAttribute(enemyStatName)
          if (redAttr && /RES/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'resRed_', attribute: redAttr },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }

          if (/DEF/i.test(enemyStatName)) {
            enemyStats.push({
              tag: { q: 'defRed_' },
              value,
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // --- "drops by N%" for RES within larger phrases ---
        const resDropMatch = seg.match(
          /(\w+)\s+RES\s+(?:<[^>]+>)?drops?\s+by\s+(\d+)%/i
        )
        if (resDropMatch) {
          const attr = matchAttribute(resDropMatch[1])
          if (attr) {
            enemyStats.push({
              tag: { q: 'resRed_', attribute: attr },
              value: Number(resDropMatch[2]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // --- Percentage stat increases ---
        // "X% more DMG" / "X% bonus DMG" (generic damage)
        const moreDmgMatch = seg.match(/(\d+)%\s+more\s+DMG/i)
        if (moreDmgMatch) {
          bonusStats.push({
            tag: { q: 'dmg_', qt: 'combat' },
            value: Number(moreDmgMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "[Qualifier] deals N% bonus [Qualifier] [stat]" (e.g., "Abloom deals 10% bonus DMG",
        // "Agents deal 30% bonus Ice DMG", "deals 10% bonus Aftershock", "deals 10% bonus CRIT DMG")
        // Must run before plain `bonusDmgMatch` so it can capture the prefix qualifier (e.g. "Abloom").
        const dealsBonusMatch = seg.match(
          /(.*?)\s*deals?\s+(\d+)%\s+bonus\s+(.*)/i
        )
        if (dealsBonusMatch) {
          const prefix = dealsBonusMatch[1].trim()
          const afterBonus = dealsBonusMatch[3].trim()
          // Check if followed by a specific stat keyword (e.g. "CRIT DMG")
          let statKey: BonusStatTag['q'] = 'dmg_'
          for (const [kw, sk] of Object.entries(statKeywords)) {
            if (afterBonus.toUpperCase().startsWith(kw.toUpperCase())) {
              statKey = sk as BonusStatTag['q']
              break
            }
          }
          // Extract qualifiers: prefix may hold a damage type (e.g. "Abloom")
          // or attribute (e.g. "Ice deals ..."), suffix may hold an attribute
          // (e.g. "... bonus Ice DMG") or damage type (e.g. "... bonus Aftershock").
          const prefixDmgType = prefix ? matchDamageType(prefix) : undefined
          const prefixAttr = prefix ? matchAttribute(prefix) : undefined
          const suffixAttr = afterBonus ? matchAttribute(afterBonus) : undefined
          const suffixDmgType = afterBonus
            ? matchDamageType(afterBonus)
            : undefined
          bonusStats.push({
            tag: {
              q: statKey,
              qt: 'combat',
              ...((suffixAttr || prefixAttr) && {
                attribute: suffixAttr || prefixAttr,
              }),
              ...((prefixDmgType || suffixDmgType) && {
                damageType1: (prefixDmgType ||
                  suffixDmgType) as BonusStatTag['damageType1'],
              }),
            },
            value: Number(dealsBonusMatch[2]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "N% bonus [Attribute] DMG" / "N% bonus DMG" (no "deals" verb)
        const bonusDmgMatch = seg.match(/(\d+)%\s+bonus\s+(?:(\w+)\s+)?DMG/i)
        if (bonusDmgMatch) {
          const qualifier = bonusDmgMatch[2]?.trim()
          const attr = qualifier ? matchAttribute(qualifier) : undefined
          bonusStats.push({
            tag: {
              q: 'dmg_',
              qt: 'combat',
              ...(attr && { attribute: attr }),
            },
            value: Number(bonusDmgMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "<Attribute> DMG increases by N%" (e.g., "Physical DMG increases by 10%")
        const attrDmgIncMatch = seg.match(
          /(\w+)\s+DMG\s+(?:<[^>]+>)?increases?\s+by\s+(\d+)%/i
        )
        if (attrDmgIncMatch) {
          const attr = matchAttribute(attrDmgIncMatch[1])
          if (attr) {
            bonusStats.push({
              tag: { q: 'dmg_', qt: 'combat', attribute: attr },
              value: Number(attrDmgIncMatch[2]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            continue
          }
        }

        // "recover N Energy" / "recovers N Energy"
        const energyRecoverMatch = seg.match(/recovers?\s+(\d+)\s+Energy/i)
        if (energyRecoverMatch) {
          bonusStats.push({
            tag: { q: 'enerRegen_', qt: 'combat' },
            value: Number(energyRecoverMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "recover N additional Decibels"
        const decibelRecoverMatch = seg.match(
          /recovers?\s+(?:all\s+squad\s+members['']?\s+)?(?:an?\s+)?(?:additional\s+)?(\d+)\s+(?:additional\s+)?Decibels?/i
        )
        if (decibelRecoverMatch) {
          bonusStats.push({
            tag: { q: 'enerRegen_', qt: 'combat' },
            value: Number(decibelRecoverMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "restores N Energy"
        const energyRestoreMatch = seg.match(/restores?\s+(\d+)\s+Energy/i)
        if (energyRestoreMatch) {
          bonusStats.push({
            tag: { q: 'enerRegen_', qt: 'combat' },
            value: Number(energyRestoreMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "restores N Decibels"
        const decibelRestoreMatch = seg.match(/restores?\s+(\d+)\s+Decibels?/i)
        if (decibelRestoreMatch) {
          bonusStats.push({
            tag: { q: 'enerRegen_', qt: 'combat' },
            value: Number(decibelRestoreMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "gain N points of Anomaly Proficiency"
        const anomProfGainMatch = seg.match(
          /gain\s+(\d+)\s+points?\s+of\s+Anomaly\s+Proficiency/i
        )
        if (anomProfGainMatch) {
          bonusStats.push({
            tag: { q: 'anomProf', qt: 'combat' },
            value: Number(anomProfGainMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "increases Anomaly Proficiency by N points"
        const anomProfIncMatch = seg.match(
          /(?:increases?|increased)\s+(?:Agent(?:'s)?\s+)?Anomaly\s+Proficiency\s+by\s+(\d+)\s+points?/i
        )
        if (anomProfIncMatch) {
          bonusStats.push({
            tag: { q: 'anomProf', qt: 'combat' },
            value: Number(anomProfIncMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "increases Agent's Anomaly Proficiency by N"
        const anomProfIncMatch2 = seg.match(
          /(?:increases?|increased)\s+(?:Agent(?:'s)?\s+)?Anomaly\s+Proficiency\s+by\s+(\d+)(?:\s|$|\.|,)/i
        )
        if (anomProfIncMatch2) {
          bonusStats.push({
            tag: { q: 'anomProf', qt: 'combat' },
            value: Number(anomProfIncMatch2[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "Anomaly Proficiency increases by N"
        const anomProfIncMatch3 = seg.match(
          /Anomaly\s+Proficiency\s+(?:<[^>]+>)?increases?\s+by\s+(\d+)(?:\s|$|\.|,)/i
        )
        if (anomProfIncMatch3) {
          bonusStats.push({
            tag: { q: 'anomProf', qt: 'combat' },
            value: Number(anomProfIncMatch3[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "Anomaly Proficiency by N"
        const anomProfIncMatch4 = seg.match(
          /Anomaly\s+Proficiency\s+(?:<[^>]+>)?by\s+(\d+)(?:\s|$|\.|,)/i
        )
        if (anomProfIncMatch4) {
          bonusStats.push({
            tag: { q: 'anomProf', qt: 'combat' },
            value: Number(anomProfIncMatch4[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // "recovers N additional Decibels"
        const decibelMatch = seg.match(
          /recovers?\s+(?:all\s+squad\s+members['']?\s+)?(?:an?\s+)?(?:additional\s+)?(\d+)\s+(?:additional\s+)?Decibels?/i
        )
        if (decibelMatch) {
          bonusStats.push({
            tag: { q: 'enerRegen_', qt: 'combat' },
            value: Number(decibelMatch[1]),
            ...(conditional && { conditional: true }),
            ...(specialty && { specialty }),
          })
          continue
        }

        // Try to find a stat keyword at the start of the segment
        let found = false
        for (const [kw, statKey] of Object.entries(statKeywords)) {
          if (!seg.startsWith(kw)) continue

          const pctMatch = seg.match(/(\d+)%/)
          if (pctMatch) {
            bonusStats.push({
              tag: {
                q: statKey as BonusStatTag['q'],
                qt: 'combat',
                ...(!percentageStats.has(statKey) && matchAttribute(seg)
                  ? { attribute: matchAttribute(seg) }
                  : {}),
                ...(matchDamageType(seg) && {
                  damageType1: matchDamageType(
                    seg
                  ) as BonusStatTag['damageType1'],
                }),
              },
              value: Number(pctMatch[1]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            found = true
            break
          }

          // Flat value (e.g., "Anomaly Proficiency increases by 40")
          const flatMatch = seg.match(/(?:by|pts|points)\s+(\d+)/)
          if (flatMatch) {
            bonusStats.push({
              tag: {
                q: statKey as BonusStatTag['q'],
                qt: 'combat',
                ...(matchAttribute(seg) && {
                  attribute: matchAttribute(seg)!,
                }),
              },
              value: Number(flatMatch[1]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            found = true
            break
          }
        }
        if (found) continue

        // Try to find a stat keyword anywhere in the segment
        for (const [kw, statKey] of Object.entries(statKeywords)) {
          if (!seg.includes(kw)) continue

          const pctMatch = seg.match(/(\d+)%/)
          if (pctMatch) {
            bonusStats.push({
              tag: {
                q: statKey as BonusStatTag['q'],
                qt: 'combat',
                ...(!percentageStats.has(statKey) && matchAttribute(seg)
                  ? { attribute: matchAttribute(seg) }
                  : {}),
                ...(matchDamageType(seg) && {
                  damageType1: matchDamageType(
                    seg
                  ) as BonusStatTag['damageType1'],
                }),
              },
              value: Number(pctMatch[1]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            found = true
            break
          }

          // Flat value
          const flatMatch = seg.match(/(?:by|pts|points)\s+(\d+)/)
          if (flatMatch) {
            bonusStats.push({
              tag: {
                q: statKey as BonusStatTag['q'],
                qt: 'combat',
                ...(matchAttribute(seg) && {
                  attribute: matchAttribute(seg)!,
                }),
              },
              value: Number(flatMatch[1]),
              ...(conditional && { conditional: true }),
              ...(specialty && { specialty }),
            })
            found = true
            break
          }
        }
        if (found) continue

        // Skip unmappable stats
        if (
          /Miasma Shield/i.test(seg) ||
          /Decibel Generation Rate/i.test(seg) ||
          /Energy generation rate/i.test(seg) ||
          /Energy and Adrenaline Generation Rate/i.test(seg) ||
          /Stun recovery speed/i.test(seg)
        )
          continue
      }

      // Apply stack multiplier to all stats parsed from this sentence
      if (stackMult > 1) {
        for (let i = bonusStatsBefore; i < bonusStats.length; i++)
          bonusStats[i].value *= stackMult
        for (let i = enemyStatsBefore; i < enemyStats.length; i++)
          enemyStats[i].value *= stackMult
      }
    }
  }

  return { bonusStats, enemyStats }
}
