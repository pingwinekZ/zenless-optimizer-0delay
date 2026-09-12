import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Ellen } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Ellen'
const [, ch] = trans('char', key)
const cond = Ellen.conditionals
const buff = Ellen.buffs

function CoreDescription() {
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={0} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={1} />
    </>
  )
}

function AbilityDescription() {
  const ns = 'char_Ellen_gen'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns={ns} key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

function PotentialDescription() {
  const ns = 'char_Ellen_gen'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns={ns} key18="potential.desc.6" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_basic_crit_dmg_.tag)}>
              {ch('core_flash_freeze_trimming_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_basic_crit_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_basic_crit_dmg_.tag)}>
              {ch('core_icy_blade_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_basic_crit_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_basic_crit_dmg_.tag)}>
              {ch('core_glacial_blade_wave_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_basic_crit_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_dash_crit_dmg_.tag)}>
              {ch('core_charged_scissors_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_dash_crit_dmg_.tag,
        },
        fieldForBuff(buff.core_chain_crit_dmg_),
        fieldForBuff(buff.core_ult_crit_dmg_),
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityIceAttacksCond'),
        description: <AbilityDescription />,
        metadata: cond.ability_ice_attacks,
        linked: ['potential_ice_attacks'],
        fields: [fieldForBuff(buff.ability_ice_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('potentialIceAttacksCond'),
        description: <PotentialDescription />,
        metadata: cond.potential_ice_attacks,
        linked: ['ability_ice_attacks'],
        fields: [
          fieldForBuff(buff.ability_crit_dmg_),
          fieldForBuff(buff.ability_ice_resIgn_),
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
            ns="char_Ellen_gen"
            key18="mindscapes.1.desc"
            from="For each <ct color=#FFFFFF>Flash Freeze Charge</ct> consumed"
            to="calculated separately"
          />
        ),
        metadata: cond.flash_freeze_consumed,
        fields: [fieldForBuff(buff.m1_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns="char_Ellen_gen"
            key18="mindscapes.2.desc"
            from="For each point of <ct color=#FFFFFF>Flash Freeze Charge</ct>"
            to="up to a max of 60%"
          />
        ),
        metadata: cond.flash_freeze,
        fields: [fieldForBuff(buff.m2_exSpecial_crit_dmg_)],
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
            ns="char_Ellen_gen"
            key18="mindscapes.6.desc"
            from="When Ellen uses an"
            to="for 6s"
            toExact
          />
        ),
        metadata: cond.exSpecial_chain_quickCharge,
        fields: [fieldForBuff(buff.m6_pen_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond2'),
        description: <GameDesc ns="char_Ellen_gen" key18="mindscapes.6.desc" />,
        metadata: cond.feast_begins,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_dash_mv_mult_.tag)}>
                {ch('m6_feast_dmg')}
              </ColorText>
            ),
            fieldRef: buff.m6_dash_mv_mult_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
