import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { OrphieMagus } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'OrphieMagus'
const [, ch] = trans('char', key)
const cond = OrphieMagus.conditionals
const buff = OrphieMagus.buffs
const formula = OrphieMagus.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        fieldForBuff(buff.core_crit_),
        fieldForBuff(buff.core_aftershock_dmg_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={3} />,
        metadata: cond.zeroedIn,
        fields: [fieldForBuff(buff.core_atk)],
        linked: ['zeroedIn_ability', 'zeroedIn_m1_dmg'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_OrphieMagus_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_OrphieMagus_gen" key18="ability.desc.1" />
          </>
        ),
        metadata: cond.zeroedIn_ability,
        fields: [fieldForBuff(buff.ability_aftershock_defIgn_)],
        linked: ['zeroedIn', 'zeroedIn_m1_dmg'],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_corrosiveFlash_resIgn_.tag)}>
              {ch('m1_corrosiveFlash_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_corrosiveFlash_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_crimsonVortex_resIgn_.tag)}>
              {ch('m1_crimsonVortex_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_crimsonVortex_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_heatCharge_resIgn_.tag)}>
              {ch('m1_heatCharge_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_heatCharge_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_fieryEruption_resIgn_.tag)}>
              {ch('m1_fieryEruption_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_fieryEruption_resIgn_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDesc ns="char_OrphieMagus_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.zeroedIn_m1_dmg,
        fields: [fieldForBuff(buff.m1_common_dmg_)],
        linked: ['zeroedIn', 'zeroedIn_ability'],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_OrphieMagus_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.ultUsed,
        fields: [fieldForBuff(buff.m2_atk_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_heatCharge_dmg_.tag)}>
              {ch('m4_heatCharge_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_heatCharge_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_ultimate_dmg_.tag)}>
              {ch('m4_ultimate_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_ultimate_dmg_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_dmg') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6AdditionalDmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
