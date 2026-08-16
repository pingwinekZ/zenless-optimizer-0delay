import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Yanagi } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { st, trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Yanagi'
const [, ch] = trans('char', key)
const cond = Yanagi.conditionals
const buff = Yanagi.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackTsukuyomiKagura: [
        {
          type: 'conditional',
          conditional: {
            label: ch('jougenCond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="basic.BasicAttackTsukuyomiKagura.desc"
              />
            ),
            metadata: cond.jougen,
            fields: [
              {
                title: (
                  <ColorText color={getVariant(buff.basic_electric_dmg_.tag)}>
                    {ch('basic_electric_dmg_')}
                  </ColorText>
                ),
                fieldRef: buff.basic_electric_dmg_.tag,
              },
            ],
          },
        },
        {
          type: 'conditional',
          conditional: {
            label: ch('kagenCond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="basic.BasicAttackTsukuyomiKagura.desc"
              />
            ),
            metadata: cond.kagen,
            fields: [fieldForBuff(buff.basic_pen_)],
          },
        },
      ],
    },
    special: {
      EXSpecialAttackGekkaRuten: [
        {
          type: 'conditional',
          conditional: {
            label: ch('polarityDisorderCond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="special.EXSpecialAttackGekkaRuten.desc"
              />
            ),
            metadata: cond.polarityDisorder,
            fields: [
              fieldForBuff(buff.polarity_anom_base_),
              fieldForBuff(buff.polarity_anom_flat_dmg),
            ],
          },
        },
        {
          type: 'conditional',
          conditional: {
            label: ch('perSkillThrustsCond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="special.EXSpecialAttackGekkaRuten.desc"
              />
            ),
            metadata: cond.perSkill_thrusts,
          },
        },
      ],
    },
    chain: {
      UltimateRaieiTenge: [
        {
          type: 'conditional',
          conditional: {
            label: ch('perSkillThrustsCond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="chain.UltimateRaieiTenge.desc"
              />
            ),
            metadata: cond.perSkill_thrusts,
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('core_header') },
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.exSpecial)' }),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.exSpecial_used,
        fields: [
          fieldForBuff(buff.core_addl_disorder_),
          {
            title: (
              <ColorText color={getVariant(buff.core_electric_dmg_.tag)}>
                {ch('core_electric_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_electric_dmg_.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m1_header') },
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.clarity,
        fields: [fieldForBuff(buff.m1_anomProf)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m2_header') },
      conditional: {
        label: ch('perSkillThrustsCond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.perSkill_thrusts,
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m4_header') },
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.exposed,
        fields: [fieldForBuff(buff.m4_pen_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m6_header') },
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.shinrabanshou,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_exSpecial_dmg_.tag)}>
                {ch('m6_exSpecial_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_exSpecial_dmg_.tag,
          },
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('perSkillThrustsCond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.perSkill_thrusts,
      },
    },
  ],
})

export default sheet
