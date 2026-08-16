import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { ZhuYuan } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'ZhuYuan'
const [, ch] = trans('char', key)
const cond = ZhuYuan.conditionals
const buff = ZhuYuan.buffs
const formula = ZhuYuan.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: ch('core_dmg_'),
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
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_ZhuYuan_gen"
            key18="ability.desc"
          />
        ),
        metadata: cond.ex_chain_ult_used,
        fields: [fieldForBuff(buff.ability_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('suppresiveModeCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_ZhuYuan_gen"
            key18="mindscapes.2.desc"
          />
        ),
        metadata: cond.suppresive_mode,
        fields: [fieldForBuff(buff.m2_dmg_red_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('shotshellsHitCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_ZhuYuan_gen"
            key18="mindscapes.2.desc"
          />
        ),
        metadata: cond.shotshells_hit,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dash_ether_dmg_.tag)}>
                {ch('m2_basic_dash_ether_dmg_')}
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
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_dash_ether_res_ign_.tag)}
            >
              {ch('m4_basic_dash_ether_res_ign_')}
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
