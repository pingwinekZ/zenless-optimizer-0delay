import { dumpFile } from '@zenless-optimizer/common/pipeline'
import { nameToKey } from '@zenless-optimizer/common/util'
import type { CharacterKey } from '../../../../consts'
import type { CharacterData } from '../../../../dm'
import { charactersDetailedJSONData, filterUnbuffedKits } from '../../../../dm'
import { processText } from './util'

export function dumpChars(fileDir: string) {
  const charNames = {} as Record<CharacterKey, string>

  Object.entries(charactersDetailedJSONData).forEach(([charKey, charData]) => {
    charNames[charKey] = charData.name

    dumpFile(`${fileDir}/char_${charKey}_gen.json`, {
      name: charData.name,
      fullName: charData.fullname,
      ...getSkillStrings(charData.skills),
      core: getCoreStrings(charData.cores),
      ability: getAbilityStrings(charData.cores),
      mindscapes: getMindscapeStrings(charData.mindscapes),
      potential: getPotentialStrings(charData.potential),
    })
  })
  dumpFile(`${fileDir}/charNames_gen.json`, charNames)
}

const skillExceptions = new Set([
  'StanceJougen',
  'StanceKagen',
  'DashAttackTigerSevenFormsMountainKingsGameMomentum',
  'BasicAttackFallingPetalsDownfallFirstForm',
  'BasicAttackFallingPetalsDownfallSecondForm',
  'ChasingThunder',
  // Sigrid's Converging Spear stage variants only have params, no desc
  'BasicAttackConvergingSpear1stStage',
  'BasicAttackConvergingSpear2ndStage',
  'BasicAttackConvergingSpear3rdStage',
])

function getSkillStrings(data: CharacterData['skills']) {
  return Object.fromEntries(
    Object.entries(data).map(([key, skill]) => [
      `${key.charAt(0).toLowerCase()}${key.slice(1)}`,
      buildSkillVariant(skill, filterUnbuffedKits),
    ])
  )
}

type SkillData = CharacterData['skills'][keyof CharacterData['skills']]

function buildSkillVariant(
  skill: SkillData,
  filter: (ability: { Potential: number[] }) => boolean
) {
  const descriptions = skill.Description.filter(filter)
  return Object.fromEntries(
    descriptions
      .filter(
        (ability) =>
          !!ability.Desc || skillExceptions.has(nameToKey(ability.Name))
      )
      .map((ability) => {
        const abilityName = ability.Name
        // Copy param text by iterating again and finding the param details
        const params = descriptions
          .filter(
            (ability2) => ability2.Name === abilityName && !!ability2.Param
          )
          .flatMap((ability2) => [
            ...new Set(
              ability2.Param!.map((param) => processParamText(param.Name))
            ),
          ])
        return [
          nameToKey(abilityName),
          {
            name: abilityName,
            desc: processText(ability.Desc || ''),
            params,
          },
        ]
      })
  )
}

function processParamText(text: string) {
  return text.replace(/\s*(DMG Multiplier|Daze Multiplier)/, '').trim() + ' '
}

function getCoreStrings(data: CharacterData['cores']) {
  return {
    name: Object.values(data.Level).filter(filterUnbuffedKits)[1].Name[0],
    desc: Object.values(data.Level)
      .filter(filterUnbuffedKits)
      .map((level) => processText(level.Desc[0])),
  }
}

function getAbilityStrings(data: CharacterData['cores']) {
  return {
    name: Object.values(data.Level).filter(filterUnbuffedKits)[1].Name[1],
    desc: processText(
      Object.values(data.Level).filter(filterUnbuffedKits)[1].Desc[1]
    ),
  }
}

function getMindscapeStrings(data: CharacterData['mindscapes']) {
  return Object.fromEntries(
    Object.values(data).map((ms) => [
      ms.Level,
      {
        name: ms.Name,
        desc: processText(ms.Desc),
        flavor: processText(ms.Desc2),
      },
    ])
  )
}

function getPotentialStrings(data: CharacterData['potential']) {
  if (Object.keys(data).length === 0) {
    return {}
  }
  const desc = Object.values(data).map((pot) => processText(pot.Desc))
  desc.unshift('')
  return {
    name: Object.values(data).filter((_, i) => i > 0)[0].Name,
    desc,
  }
}
