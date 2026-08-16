import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Dialyn } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Dialyn'
const [, ch] = trans('char', key)
const cond = Dialyn.conditionals
const buff = Dialyn.buffs
const formula = Dialyn.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [fieldForBuff(buff.core_impact)],
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [fieldForBuff(buff.ability_exSpecial_crit_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveCommonCond'),
        description: (
          <>
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.2" />
          </>
        ),
        metadata: cond.overwhelmingly_positive_common,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
        linked: [
          'overwhelmingly_positive_resIgn',
          'overwhelmingly_positive_atk',
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('teammateSlotCond'),
        description: (
          <>
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.3" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.4" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.5" />
          </>
        ),
        metadata: cond.teammateSlot,
        badge: (_, value) =>
          value > 0 ? ch(`teammateSlot_.${value}`) : undefined,
        fields: [fieldForBuff(buff.ability_flat_dmg)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveResIgnCond'),
        description: (
          <GameDesc ns="char_Dialyn_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.overwhelmingly_positive_resIgn,
        fields: [fieldForBuff(buff.m1_resIgn_)],
        linked: [
          'overwhelmingly_positive_common',
          'overwhelmingly_positive_atk',
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('maliciousComplaintCond'),
        description: (
          <GameDesc ns="char_Dialyn_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.malicious_complaint,
        fields: [fieldForBuff(buff.m2_common_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveAtkCond'),
        description: (
          <GameDesc ns="char_Dialyn_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.overwhelmingly_positive_atk,
        fields: [fieldForBuff(buff.m4_atk)],
        linked: [
          'overwhelmingly_positive_common',
          'overwhelmingly_positive_resIgn',
        ],
      },
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
