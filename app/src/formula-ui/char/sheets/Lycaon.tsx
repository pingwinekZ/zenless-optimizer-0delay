import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Lycaon } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Lycaon'
const [, ch] = trans('char', key)
const cond = Lycaon.conditionals
const buff = Lycaon.buffs

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Lycaon_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Lycaon_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

function EncirclePreyDescription() {
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={2} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={3} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={4} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={5} />
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_daze_header') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [
        fieldForBuff(buff.core_basic_dazeInc_),
        fieldForBuff(buff.core_dodgeCounter_dazeInc_),
        fieldForBuff(buff.core_dash_dazeInc_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('resShredCond'),
        description: <CoreGameDesc characterKey={key} paragraph={1} />,
        metadata: cond.exSpecial_assistFollowUp_hit,
        fields: [
          fieldForBuff(buff.core_ice_resRed_),
          fieldForBuff(buff.core_ether_dmgInc_),
          fieldForBuff(buff.core_electric_dmgInc_),
          fieldForBuff(buff.core_fire_dmgInc_),
          fieldForBuff(buff.core_physical_dmgInc_),
          fieldForBuff(buff.core_wind_dmgInc_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('encirclePreyCond'),
        description: <EncirclePreyDescription />,
        metadata: cond.durationLeft,
        fields: [
          {
            title: (
              <ColorText
                color={getVariant(buff.core_assistFollowUp_dazeInc_.tag)}
              >
                {ch('core_assistFollowUp_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.core_assistFollowUp_dazeInc_.tag,
          },
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('stunnedEnemyHitCond'),
        description: <AbilityDescription />,
        metadata: cond.stunned_enemy_hit,
        fields: [fieldForBuff(buff.ability_stun_)],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('encirclePreyActiveCond'),
        description: <GameDesc ns="char_Lycaon_gen" key18="potential.desc.6" />,
        metadata: cond.encircle_prey_active,
        fields: [fieldForBuff(buff.potential_impact_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: <GameDesc ns="char_Lycaon_gen" key18="mindscapes.1.desc" />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_dazeInc_.tag)}>
              {ch('m1_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.m1_dazeInc_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_fullCharge_dazeInc_.tag)}>
              {ch('m1_fullCharge_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.m1_fullCharge_dazeInc_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('chargedHitsCond'),
        description: (
          <GameDesc ns="char_Lycaon_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.charged_hits,
        fields: [fieldForBuff(buff.m6_common_dmg_)],
      },
    },
  ],
})

export default sheet
