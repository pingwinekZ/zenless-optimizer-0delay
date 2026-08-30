import { ColorText } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Harumasa } from '../../../formula'
import { GameDesc, GameDescSlice, GameText, sliceBetween } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Harumasa'
const [, ch] = trans('char', key)
const cond = Harumasa.conditionals
const buff = Harumasa.buffs
const formula = Harumasa.formulas

function CoreCritRateDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const { t } = useTranslation('char_Harumasa_gen')
  const text = useMemo(() => {
    const desc = t(`core.desc.${coreLevel}`)
    if (typeof desc !== 'string') return undefined
    const slice = sliceBetween(desc, 'The CRIT Rate of', 'increase by')
    if (slice === undefined) return undefined
    // The P0 sentence continues with ", and when Harumasa's ..." — cut the
    // slice at the first tagged number and close the clause with a period.
    const pct = slice.indexOf('%')
    const tagEnd = pct >= 0 ? slice.indexOf('</ct>', pct) : -1
    if (tagEnd >= 0) return slice.slice(0, tagEnd + 5) + '.'
    return slice
  }, [t, coreLevel])
  if (text === undefined) return null
  return <GameText text={text} />
}

function GleamingEdgeDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return (
    <GameDescSlice
      ns="char_Harumasa_gen"
      key18={`core.desc.${coreLevel}`}
      from="When Harumasa's"
      to="Ultimate by"
      capitalize
    />
  )
}

function PotentialDescription() {
  return <GameDesc ns="char_Harumasa_gen" key18="potential.desc.6" />
}

function AbilityDamageDescription() {
  return (
    <>
      <SkillGameDesc
        characterKey={key}
        ns="char_Harumasa_gen"
        key18="ability.desc.0"
      />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Harumasa_gen"
          key18="ability.desc.1"
          from="When Harumasa's attacks"
          to="his DMG increases by"
        />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_crit_header') },
      description: <CoreCritRateDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_dash_crit_.tag)}>
              {ch('core_dash_crit_')}
            </ColorText>
          ),
          fieldRef: buff.core_dash_crit_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_chasing_thunder_crit_.tag)}>
              {ch('core_chasing_thunder_crit_')}
            </ColorText>
          ),
          fieldRef: buff.core_chasing_thunder_crit_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_ult_crit_.tag)}>
              {ch('core_ult_crit_')}
            </ColorText>
          ),
          fieldRef: buff.core_ult_crit_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('gleamingEdgeCond'),
        description: <GleamingEdgeDescription />,
        metadata: cond.gleaming_edge,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_dash_crit_dmg_.tag)}>
                {ch('core_dash_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_dash_crit_dmg_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.core_chasing_thunder_crit_dmg_.tag)}
              >
                {ch('core_chasing_thunder_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_chasing_thunder_crit_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.core_ult_crit_dmg_.tag)}>
                {ch('core_ult_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_ult_crit_dmg_.tag,
          },
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <AbilityDamageDescription />,
        metadata: cond.enemy_anomaly,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('potentialCond'),
        description: <PotentialDescription />,
        metadata: cond.exSpecial_chain_ult_activated,
        fields: [
          fieldForBuff(buff.potential_atk_),
          {
            title: (
              <ColorText
                color={getVariant(buff.potential_dash_electric_resIgn_.tag)}
              >
                {ch('potential_dash_resIgn_')}
              </ColorText>
            ),
            fieldRef: buff.potential_dash_electric_resIgn_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(
                  buff.potential_chasing_thunder_electric_resIgn_.tag
                )}
              >
                {ch('potential_chasing_thunder_resIgn_')}
              </ColorText>
            ),
            fieldRef: buff.potential_chasing_thunder_electric_resIgn_.tag,
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Harumasa_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.electro_blitz,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_dash_dmg_.tag)}>
                {ch('m2_dash_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_dash_dmg_.tag,
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_Harumasa_gen"
            key18="mindscapes.6.desc"
            from="After <ct color=#FFFFFF>Ha-Oto no Ya</ct> hits Stunned enemies"
            to="for 12s"
          />
        ),
        metadata: cond.haOtoNoYa,
        fields: [fieldForBuff(buff.m6_electric_resIgn_)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_additional_dmg') },
      description: (
        <GameDescSlice
          ns="char_Harumasa_gen"
          key18="mindscapes.6.desc"
          from="Every 12 times an enemy is hit by"
          to="Electric DMG"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
