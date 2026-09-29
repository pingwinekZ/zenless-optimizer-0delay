import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Zhao } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Zhao'
const [, ch] = trans('char', key)
const cond = Zhao.conditionals
const buff = Zhao.buffs

function CoreCritDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={0} />
      <PrefixedLine prefix="M6" dimmed={mindscape < 6}>
        <GameDescSlice
          ns="char_Zhao_gen"
          key18="mindscapes.6.desc"
          from="The CRIT Rate buff"
          to="125%"
        />
      </PrefixedLine>
    </>
  )
}

function FinalVerdictDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <SkillGameDesc
        characterKey={key}
        ns="char_Zhao_gen"
        key18="basic.BasicAttackFinalVerdict.desc"
        paragraph={2}
      />
      <PrefixedLine prefix="M6" dimmed={mindscape < 6}>
        <GameDescSlice
          ns="char_Zhao_gen"
          key18="mindscapes.6.desc"
          from="The extra DMG gained"
          to="no longer consumed when attacking"
        />
      </PrefixedLine>
    </>
  )
}

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Zhao_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Zhao_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackFinalVerdict: [
        {
          type: 'conditional',
          conditional: {
            label: ch('finalVerdictCond'),
            description: <FinalVerdictDescription />,
            metadata: cond.chargeTime,
            fields: [
              {
                title: (
                  <ColorText color={getVariant(buff.basic_flat_dmg.tag)}>
                    {ch('basic_flat_dmg')}
                  </ColorText>
                ),
                fieldRef: buff.basic_flat_dmg.tag,
              },
              {
                title: (
                  <ColorText color={getVariant(buff.chain_flat_dmg.tag)}>
                    {ch('chain_flat_dmg')}
                  </ColorText>
                ),
                fieldRef: buff.chain_flat_dmg.tag,
              },
              {
                title: (
                  <ColorText
                    color={getVariant(buff.assistFollowUp_flat_dmg.tag)}
                  >
                    {ch('assistFollowUp_flat_dmg')}
                  </ColorText>
                ),
                fieldRef: buff.assistFollowUp_flat_dmg.tag,
              },
            ],
          },
        },
      ],
    },
    special: {},
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_crit_') },
      description: <CoreCritDescription />,
      fields: [fieldForBuff(buff.core_crit_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherVeilWellspringHpCond'),
        description: <CoreGameDesc characterKey={key} paragraph={5} />,
        metadata: cond.etherVeilWellspring_hp,
        fields: [fieldForBuff(buff.core_hp_)],
        linked: ['etherVeilWellspring_atk'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherVeilWellspringAtkCond'),
        description: <CoreGameDesc characterKey={key} paragraph={6} />,
        metadata: cond.etherVeilWellspring_atk,
        fields: [fieldForBuff(buff.core_atk)],
        linked: ['etherVeilWellspring_hp'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <AbilityDescription />,
        metadata: cond.inEtherVeil,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_Zhao_gen" key18="mindscapes.1.desc" />,
        metadata: cond.offField,
        fields: [fieldForBuff(buff.m1_resIgn_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns="char_Zhao_gen" key18="mindscapes.2.desc" />,
        metadata: cond.recoversHp,
        fields: [fieldForBuff(buff.m2_atk_), fieldForBuff(buff.m2_team_atk_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      description: (
        <GameDescSlice
          ns="char_Zhao_gen"
          key18="mindscapes.4.desc"
          from="The CRIT DMG of"
          to="increase by 40%"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_ult_crit_dmg_.tag)}>
              {ch('m4_ult_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_ult_crit_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_chain_crit_dmg_.tag)}>
              {ch('m4_chain_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_chain_crit_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_basic_crit_dmg_.tag)}>
              {ch('m4_basic_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_crit_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
