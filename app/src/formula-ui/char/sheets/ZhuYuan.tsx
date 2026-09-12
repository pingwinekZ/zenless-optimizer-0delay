import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { ZhuYuan } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'ZhuYuan'
const [, ch] = trans('char', key)
const cond = ZhuYuan.conditionals
const buff = ZhuYuan.buffs
const formula = ZhuYuan.formulas

function AbilityDescription() {
  const ns = 'char_ZhuYuan_gen'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18="ability.desc.1"
          from="Zhu Yuan's CRIT Rate is increased by"
          to="10s"
        />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_dmg_.tag)}>
              {ch('core_basic_dmg_4')}
            </ColorText>
          ),
          fieldRef: buff.core_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_dmg_.tag)}>
              {ch('core_basic_dmg_5')}
            </ColorText>
          ),
          fieldRef: buff.core_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_dmg_.tag)}>
              {ch('core_basic_dmg_6')}
            </ColorText>
          ),
          fieldRef: buff.core_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_dmg_.tag)}>
              {ch('core_dash_dmg_2')}
            </ColorText>
          ),
          fieldRef: buff.core_dmg_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('exChainUltUsedCond'),
        description: <AbilityDescription />,
        metadata: cond.ex_chain_ult_used,
        fields: [fieldForBuff(buff.ability_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('shotshellsHitCond'),
        description: (
          <GameDescSlice
            ns="char_ZhuYuan_gen"
            key18="mindscapes.2.desc"
            from="When Zhu Yuan hits an enemy with"
            to="reset the duration."
          />
        ),
        metadata: cond.shotshells_hit,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dash_ether_dmg_.tag)}>
                {ch('m2_basic_dmg_4')}
              </ColorText>
            ),
            fieldRef: buff.m2_basic_dash_ether_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dash_ether_dmg_.tag)}>
                {ch('m2_basic_dmg_5')}
              </ColorText>
            ),
            fieldRef: buff.m2_basic_dash_ether_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dash_ether_dmg_.tag)}>
                {ch('m2_basic_dmg_6')}
              </ColorText>
            ),
            fieldRef: buff.m2_basic_dash_ether_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dash_ether_dmg_.tag)}>
                {ch('m2_dash_dmg_2')}
              </ColorText>
            ),
            fieldRef: buff.m2_basic_dash_ether_dmg_.tag,
          },
        ],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      description: <GameDesc ns="char_ZhuYuan_gen" key18="mindscapes.4.desc" />,
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_dash_ether_res_ign_.tag)}
            >
              {ch('m4_basic_resIgn_4')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_dash_ether_res_ign_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_dash_ether_res_ign_.tag)}
            >
              {ch('m4_basic_resIgn_5')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_dash_ether_res_ign_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_dash_ether_res_ign_.tag)}
            >
              {ch('m4_basic_resIgn_6')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_dash_ether_res_ign_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_dash_ether_res_ign_.tag)}
            >
              {ch('m4_dash_resIgn_2')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_dash_ether_res_ign_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_ZhuYuan_gen"
          key18="mindscapes.6.desc"
          from="Launching an <ct color=#FFFFFF>EX Special Attack</ct>"
          to="220% of Zhu Yuan's ATK"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_ether_afterglow.tag)}>
              {ch('m6_ether_afterglow')}
            </ColorText>
          ),
          fieldRef: formula.m6_ether_afterglow.tag,
        },
      ],
    },
  ],
})

export default sheet
