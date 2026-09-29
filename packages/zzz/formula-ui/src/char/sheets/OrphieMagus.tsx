import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { OrphieMagus } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
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
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
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
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_OrphieMagus_gen" key18="ability.desc.1" />
            </AbilityBodyText>
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
      description: (
        <GameDescSlice
          ns="char_OrphieMagus_gen"
          key18="mindscapes.1.desc"
          from="Orphie & Magus' Special Attack: Corrosive Flash"
          to="Fire RES</ct>"
          toExact
        />
      ),
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
          <GameDescSlice
            ns="char_OrphieMagus_gen"
            key18="mindscapes.1.desc"
            from="Agents with Zeroed In deal"
            to="20% increased DMG"
          />
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
          <GameDescSlice
            ns="char_OrphieMagus_gen"
            key18="mindscapes.2.desc"
            from="After Orphie & Magus use their Ultimate"
            to="for up to 45s"
          />
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
      description: (
        <GameDescSlice
          ns="char_OrphieMagus_gen"
          key18="mindscapes.4.desc"
          from="Orphie & Magus's EX Special Attack: Heat Charge"
          to="DMG increases by 40%"
        />
      ),
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
      description: (
        <GameDescSlice
          ns="char_OrphieMagus_gen"
          key18="mindscapes.6.desc"
          from="When the laser from EX Special Attack: Heat Charge or Ultimate hits enemies"
          to="counted as EX Special Attack and Aftershock DMG"
        />
      ),
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
