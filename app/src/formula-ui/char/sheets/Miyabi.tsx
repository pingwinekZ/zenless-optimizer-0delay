import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Miyabi } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Miyabi'
const [, ch] = trans('char', key)
const cond = Miyabi.conditionals
const buff = Miyabi.buffs
const formula = Miyabi.formulas

function CoreDescription() {
  const char = useCharacter(key)
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDescSlice
        ns="char_Miyabi_gen"
        key18={`core.desc.${char?.core ?? 0}.1`}
        from="When Hoshimi Miyabi applies"
        to="causing the target to enter"
      />
      <PrefixedLine prefix="M4" dimmed={mindscape < 4}>
        <GameDescSlice
          ns="char_Miyabi_gen"
          key18="mindscapes.4.desc"
          from="<ct color=#FFFFFF>Frostburn - Break</ct> DMG"
          to="%"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateLingeringSnow: [
        {
          type: 'conditional',
          conditional: {
            label: ch('ultIceDmgCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Miyabi_gen"
                key18="chain.UltimateLingeringSnow.desc"
                paragraph={2}
              />
            ),
            metadata: cond.ult_used,
            fields: [fieldForBuff(buff.ult_ice_dmg_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      description: <CoreDescription />,
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_frostburnBreak_dmg.tag)}>
              {ch('core_frostburnBreak_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_frostburnBreak_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      description: (
        <>
          <GameDesc ns="char_Miyabi_gen" key18="ability.desc.0" />
          <div style={{ marginTop: 8 }}>
            <GameDescSlice
              ns="char_Miyabi_gen"
              key18="ability.desc.1"
              from="<ct color=#FFFFFF>Basic Attack: Shimotsuki</ct> DMG"
              to="%"
            />
          </div>
        </>
      ),
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_dmg_.tag)}>
              {ch('ability_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_Miyabi_gen" key18="ability.desc.0" />
            <div style={{ marginTop: 8 }}>
              <GameDescSlice
                ns="char_Miyabi_gen"
                key18="ability.desc.1"
                from="When any squad member triggers"
                to="%"
              />
            </div>
          </>
        ),
        metadata: cond.disorder_triggered,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.ability_ice_resIgn_.tag)}>
                {ch('ability_ice_resIgn_')}
              </ColorText>
            ),
            fieldRef: buff.ability_ice_resIgn_.tag,
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
        description: (
          <GameDescSlice
            ns="char_Miyabi_gen"
            key18="mindscapes.1.desc"
            from="While in"
            to="stacking up to 6 times"
          />
        ),
        metadata: cond.fallen_frost,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m1_defIgn_.tag)}>
                {ch('m1_defIgn_')}
              </ColorText>
            ),
            fieldRef: buff.m1_defIgn_.tag,
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Miyabi_gen"
          key18="mindscapes.2.desc"
          from="<ct color=#FFFFFF>Basic Attack: Kazahana</ct> and <ct color=#FFFFFF>Dodge Counter</ct> DMG"
          to="%"
        />
      ),
      header: { icon: null, text: ch('m2_dmg_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_dmg_.tag)}>
              {ch('m2_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_dmg_.tag,
        },
        fieldForBuff(buff.m2_dodgeCounter_dmg_),
      ],
    },
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Miyabi_gen"
          key18="mindscapes.2.desc"
          from="Upon entering the battlefield"
          to="%"
        />
      ),
      header: { icon: null, text: ch('m2_crit_header') },
      fields: [fieldForBuff(buff.m2_crit_)],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_Miyabi_gen"
            key18="mindscapes.6.desc"
            from="During <ct color=#FFFFFF>Shimotsuki Stance</ct>"
            to="DMG by 30%"
          />
        ),
        metadata: cond.polar,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_dmg_.tag)}>
                {ch('m6_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
