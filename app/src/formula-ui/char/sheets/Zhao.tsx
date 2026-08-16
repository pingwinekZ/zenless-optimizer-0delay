import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Zhao } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Zhao'
const [, ch] = trans('char', key)
const cond = Zhao.conditionals
const buff = Zhao.buffs
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackFinalVerdict: [
        {
          type: 'conditional',
          conditional: {
            label: ch('finalVerdictCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Zhao_gen"
                key18="basic.BasicAttackFinalVerdict.desc"
              />
            ),
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
              fieldForBuff(buff.chain_flat_dmg),
              fieldForBuff(buff.assistFollowUp_flat_dmg),
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
      fields: [fieldForBuff(buff.core_crit_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherVeilWellspringCond'),
        description: (
          <>
            <CoreGameDesc characterKey={key} paragraph={5} />
            <div style={{ marginBottom: 8 }} />
            <CoreGameDesc characterKey={key} paragraph={6} />
          </>
        ),
        metadata: cond.etherVeilWellspring,
        fields: [fieldForBuff(buff.core_hp_), fieldForBuff(buff.core_atk)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <GameDesc ns="char_Zhao_gen" key18="ability.desc" />,
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
      header: { icon: null, text: ch('m4_ult_crit_dmg_') },
      fields: [
        fieldForBuff(buff.m4_ult_crit_dmg_),
        fieldForBuff(buff.m4_chain_crit_dmg_),
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
  m6: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: ch('m6_header'),
      },
      fields: [
        {
          title: ch('m6_critIncrease_'),
          fieldValue: dm.m6.critIncrease_ * 100,
          unit: '%',
        },
        {
          title: ch('m6_finalVerdictChargeIncrease_'),
          fieldValue: dm.m6.finalVerdictChargeIncrease_ * 100,
          unit: '%',
        },
      ],
    },
  ],
})

export default sheet
