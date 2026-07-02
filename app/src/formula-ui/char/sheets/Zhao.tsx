import { ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Zhao } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { st, trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'Zhao'
const [, ch] = trans('char', key)
const cond = Zhao.conditionals
const buff = Zhao.buffs
const formula = Zhao.formulas
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
              fieldForBuff(buff.basic_flat_dmg),
              fieldForBuff(buff.chain_flat_dmg),
              fieldForBuff(buff.assistFollowUp_flat_dmg),
            ],
          },
        },
      ],
    },
    special: {
      SpecialAttackShatterfrostSurge: [
        {
          type: 'fields',
          fields: [{ title: st('heal'), fieldRef: formula.special_heal.tag }],
        },
      ],
      EXSpecialAttackFrostflowTundra: [
        {
          type: 'fields',
          fields: [{ title: st('heal'), fieldRef: formula.exSpecial_heal.tag }],
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      fields: [
        {
          title: 'CP CR buff',
          fieldRef: buff.core_crit_.tag,
        },
      ],
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
      fields: [
        {
          title: 'M4 CD buff',
          fieldRef: buff.m4_ult_crit_dmg_.tag,
        },
        fieldForBuff(buff.m4_chain_crit_dmg_),
        {
          title: 'Final Verdict CRIT DMG',
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
        text: 'M6 CR and DMG buff',
      },
      fields: [
        {
          title: 'CP CR Multiplier',
          fieldValue: dm.m6.critIncrease_ * 100,
          unit: '%',
        },
        {
          title: 'Final Verdict Charge DMG Multiplier',
          fieldValue: dm.m6.finalVerdictChargeIncrease_ * 100,
          unit: '%',
        },
      ],
    },
  ],
})

export default sheet
