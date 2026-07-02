import type { CharacterKey } from '../../../consts'
import { Yanagi } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { st, trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

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
            fields: [fieldForBuff(buff.basic_electric_dmg_)],
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
            label: ch('m2Cond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="special.EXSpecialAttackGekkaRuten.desc"
              />
            ),
            metadata: cond.thrusts,
          },
        },
      ],
    },
    chain: {
      UltimateRaieiTenge: [
        {
          type: 'conditional',
          conditional: {
            label: ch('m2Cond'),
            description: (
              <GameDesc
                ns="char_Yanagi_gen"
                key18="chain.UltimateRaieiTenge.desc"
              />
            ),
            metadata: cond.thrusts,
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.exSpecial)' }),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.exSpecial_used,
        fields: [
          fieldForBuff(buff.core_addl_disorder_),
          fieldForBuff(buff.core_electric_dmg_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.basic)' }),
        description: <GameDesc ns="char_Yanagi_gen" key18="ability.desc" />,
        metadata: cond.basic_hit,
        fields: [fieldForBuff(buff.ability_electric_anomBuildup_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
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
      type: 'fields',
      fields: [fieldForBuff(buff.m2_electric_anomBuildup_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.thrusts,
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
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
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.shinrabanshou,
        fields: [fieldForBuff(buff.m6_exSpecial_dmg_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.thrusts,
      },
    },
  ],
})

export default sheet
