import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { StarlightBilly } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'StarlightBilly'
const [, ch] = trans('char', key)
const cond = StarlightBilly.conditionals
const buff = StarlightBilly.buffs
const formula = StarlightBilly.formulas

function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return (
    <GameDescSlice
      ns="char_StarlightBilly_gen"
      key18={`core.desc.${coreLevel}.2`}
      from="When his HP is greater than 25%"
      to="refresh the duration."
    />
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreDescription />,
        metadata: cond.cpCritDmg,
        fields: [fieldForBuff(buff.core_critDmg)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_StarlightBilly_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns="char_StarlightBilly_gen"
                key18="ability.desc.1"
                from="Hitting an enemy with"
                to="per use of a skill."
              />
              <GameDescSlice
                ns="char_StarlightBilly_gen"
                key18="ability.desc.1"
                from="Each stack increases the DMG"
                to="Full-Throttle Starlight"
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.starlightStacks,
        fields: [
          fieldForBuff(buff.ability_chain_dmg_),
          fieldForBuff(buff.ability_ult_dmg_),
          {
            title: (
              <ColorText color={getVariant(buff.ability_exSpecial_dmg_.tag)}>
                {ch('ability_exSpecial_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.ability_exSpecial_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
                {ch('ability_basic_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.ability_basic_dmg_.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDescSlice
            ns="char_StarlightBilly_gen"
            key18="mindscapes.1.desc"
            from="Hitting an enemy with"
            to="refresh the duration."
          />
        ),
        metadata: cond.m1PhysResIgn,
        fields: [fieldForBuff(buff.m1_physResIgn)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_StarlightBilly_gen"
          key18="mindscapes.2.desc"
          from="Increases the DMG dealt by"
          to="by 50%."
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_basic_dmg_.tag)}>
              {ch('m2_basic_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_basic_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_exSpecial_dmg_.tag)}>
              {ch('m2_exSpecial_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_exSpecial_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_ult_dmg_.tag)}>
              {ch('m2_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_ult_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('turboCond'),
        description: (
          <GameDescSlice
            ns="char_StarlightBilly_gen"
            key18="mindscapes.2.desc"
            from="Activating"
            to="can be held."
          />
        ),
        metadata: cond.turbo,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_turbo_crit_dmg_.tag)}>
                {ch('m2_turbo_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_turbo_crit_dmg_.tag,
          },
        ],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDescSlice
            ns="char_StarlightBilly_gen"
            key18="mindscapes.4.desc"
            from="While in combat"
            to="reset the duration."
          />
        ),
        metadata: cond.m4CritDmgStacks,
        fields: [fieldForBuff(buff.m4_critDmg)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_StarlightBilly_gen"
          key18="mindscapes.6.desc"
          from="Ultimate:"
          to="increases by 18%."
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_ult_sheer_.tag)}>
              {ch('m6_ult_sheer_')}
            </ColorText>
          ),
          fieldRef: buff.m6_ult_sheer_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_basic_sheer_.tag)}>
              {ch('m6_basic_sheer_')}
            </ColorText>
          ),
          fieldRef: buff.m6_basic_sheer_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('brilliantStacksCond'),
        description: (
          <GameDescSlice
            ns="char_StarlightBilly_gen"
            key18="mindscapes.6.desc"
            from="Landing the 4th hit"
            to="Physical DMG"
          />
        ),
        metadata: cond.brilliant_stacks,
        fields: [
          {
            title: (
              <ColorText color={getVariant(formula.m6_brilliant_dmg.tag)}>
                {ch('m6_brilliant_dmg')}
              </ColorText>
            ),
            fieldRef: formula.m6_brilliant_dmg.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
