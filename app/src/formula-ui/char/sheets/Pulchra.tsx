import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Pulchra } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useAbilityActive,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Pulchra'
const ns = 'char_Pulchra_gen'
const [, ch] = trans('char', key)
const cond = Pulchra.conditionals
const buff = Pulchra.buffs

function AbilityDescription() {
  const mindscape = useEffectiveMindscape(key)
  const abilityActive = useAbilityActive(key)
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns={ns} key18="ability.desc.1" />
      </AbilityBodyText>
      <PrefixedLine prefix="M6" dimmed={mindscape < 6 || !abilityActive}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc"
          from="<ct color=#FFFFFF>Additional Ability:"
          to="Aftershock</ct> DMG"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.hunters_gait,
        linked: ['hunters_gait_m2'],
        fields: [fieldForBuff(buff.core_dazeInc_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <AbilityDescription />,
        metadata: cond.binding_trap,
        linked: ['binding_trap_m1', 'binding_trap_m6'],
        fields: [
          fieldForBuff(buff.ability_aftershock_dmg_),
          {
            ...fieldForBuff(buff.ability_m6_common_dmg_),
            minPotential: 6,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.1.desc" />,
        metadata: cond.binding_trap_m1,
        linked: ['binding_trap', 'binding_trap_m6'],
        fields: [fieldForBuff(buff.m1_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.2.desc" />,
        metadata: cond.hunters_gait_m2,
        linked: ['hunters_gait'],
        fields: [fieldForBuff(buff.m2_atk_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc"
          from="<ct color=#FFFFFF>Special"
          to="increased by 2"
        />
      ),
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_special_dmg_.tag)}>
              {ch('m6_nightmare_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_special_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
