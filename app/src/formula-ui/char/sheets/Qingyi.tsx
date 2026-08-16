import type { CharacterKey } from '../../../consts'
import { Qingyi } from '../../../formula'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'Qingyi'
const [, ch] = trans('char', key)
const cond = Qingyi.conditionals
const buff = Qingyi.buffs
const formula = Qingyi.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackEnchantedMoonlitBlossoms: [
        {
          type: 'conditional',
          conditional: {
            label: ch('flashConnectCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Qingyi_gen"
                key18="basic.FlashConnect.desc"
              />
            ),
            metadata: cond.flash_connect_consumed,
            fields: [
              fieldForBuff(buff.flash_connect_dmg_),
              fieldForBuff(buff.flash_connect_dazeInc_),
            ],
          },
        },
      ],
    },
    chain: {
      ChainAttackTranquilSerenade: [
        {
          type: 'fields',
          header: { icon: null, text: ch('chain_header') },
          fields: [fieldForBuff(buff.chain_dmg_)],
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('subjugationCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.subjugation,
        fields: [fieldForBuff(buff.core_stun_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [
        fieldForBuff(buff.ability_basic_dazeInc_),
        fieldForBuff(buff.ability_atk),
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [fieldForBuff(buff.m1_defRed_), fieldForBuff(buff.m1_crit_)],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: ch('m2_stun_'),
          fieldValue: dm.m2.stun_mult_ * 100,
          unit: '%',
        },
        fieldForBuff(buff.m2_dazeInc_),
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: ch('m4_shield'),
          fieldRef: formula.m4_shield.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [fieldForBuff(buff.m6_crit_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Qingyi_gen"
            key18="mindscapes.6.desc"
          />
        ),
        metadata: cond.moonlit_blossoms_hit,
        fields: [fieldForBuff(buff.m6_resRed_)],
      },
    },
  ],
})

export default sheet
