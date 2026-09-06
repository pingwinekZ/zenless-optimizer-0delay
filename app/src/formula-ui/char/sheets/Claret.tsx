import type { CharacterKey } from '../../../consts'
import { Claret } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Claret'
const [, ch] = trans('char', key)
const cond = Claret.conditionals
const buff = Claret.buffs
const formula = Claret.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_critPerCritDmg_header') },
      fields: [fieldForBuff(buff.core_critPerCritDmg)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('crimsonInscriptionCond'),
        description: <CoreGameDesc characterKey={key} paragraph={4} />,
        metadata: cond.crimsonInscription,
        fields: [
          fieldForBuff(buff.core_crimson_crit_),
          fieldForBuff(buff.core_crimson_gashBuildup_),
        ],
        linked: ['m2_crimsonInscription'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('perfectDodgeCond'),
        description: <CoreGameDesc characterKey={key} paragraph={4} />,
        metadata: cond.perfectDodge,
        fields: [fieldForBuff(buff.core_perfectDodge_dmg_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('remnantEdgeCond'),
        description: <GameDesc ns="char_Claret_gen" key18="ability.desc.2" />,
        metadata: cond.remnantEdge,
        fields: [fieldForBuff(buff.ability_remnant_laceration_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_gashBuildup_header') },
      fields: [
        {
          title: ch('m1_gashBuildup_title'),
          fieldRef: buff.m1_gashBuildup_.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_maim_header') },
      fields: [
        {
          title: ch('m1_maim'),
          fieldRef:
            formula.SpecialAttackBloodbloomOathCleavingGoldAndIron_2_dmg.tag,
        },
        {
          title: ch('m1_maim_bloodBurial'),
          fieldRef:
            formula.SpecialAttackBloodbloomOathBloodBurialAssault_0_dmg.tag,
        },
        {
          title: ch('m1_maim_multiplier'),
          fieldRef: buff.m1_maim_mult_display_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Claret_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.m2_crimsonInscription,
        fields: [fieldForBuff(buff.m2_electric_resIgn_)],
        linked: ['crimsonInscription'],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: ch('m4_starforging'),
          fieldRef: buff.m4_starforging_dmg_.tag,
        },
        {
          title: ch('m4_resonant'),
          fieldRef: buff.m4_resonant_dmg_.tag,
        },
        {
          title: ch('m4_trial'),
          fieldRef: buff.m4_trial_dmg_.tag,
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
          title: ch('m6_maim'),
          fieldRef: formula.m6_maim.tag,
        },
      ],
    },
  ],
})

export default sheet
