import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Qingyi } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'

const key: CharacterKey = 'Qingyi'
const [, ch] = trans('char', key)
const cond = Qingyi.conditionals
const buff = Qingyi.buffs

function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <SkillGameDesc
        characterKey={key}
        ns="char_Qingyi_gen"
        key18={`core.desc.${coreLevel}`}
      />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Qingyi_gen"
          key18="mindscapes.2.desc"
          from="The Stun DMG Multiplier increase provided by each stack of"
          to="135% of its original value."
        />
      </PrefixedLine>
    </>
  )
}

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Qingyi_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Qingyi_gen"
          key18="ability.desc.1"
          from="<ct color=#FFFFFF>Basic Attacks</ct> deal"
          to="20% increased Daze."
        />
        <div style={{ marginTop: 8 }}>
          <GameDescSlice
            ns="char_Qingyi_gen"
            key18="ability.desc.1"
            from="If Qingyi's Impact is greater than 120"
            to="maximum of 600."
          />
        </div>
      </AbilityBodyText>
    </>
  )
}

function FlashConnectDescription() {
  return <GameDesc ns="char_Qingyi_gen" key18="basic.FlashConnect.desc" />
}

function ChainDescription() {
  return (
    <>
      <GameDesc
        ns="char_Qingyi_gen"
        key18="chain.ChainAttackTranquilSerenade.desc.1"
      />
      <div style={{ marginTop: 8 }}>
        <GameDesc
          ns="char_Qingyi_gen"
          key18="chain.ChainAttackTranquilSerenade.desc.2"
        />
      </div>
    </>
  )
}

function M1Description() {
  return (
    <GameDescSlice
      ns="char_Qingyi_gen"
      key18="mindscapes.1.desc"
      from="When using her <ct color=#FFFFFF>Basic Attack: Enchanted Moonlit Blossoms</ct>, if <ct color=#FFFFFF>Flash Connect Voltage</ct> is at its maximum"
      to="20% for 15s."
    />
  )
}

function M2DazeDescription() {
  return (
    <GameDescSlice
      ns="char_Qingyi_gen"
      key18="mindscapes.2.desc"
      from="When Qingyi's attack hits an enemy and the stacks of"
      to="15%."
    />
  )
}

function M6CritDescription() {
  return (
    <GameDescSlice
      ns="char_Qingyi_gen"
      key18="mindscapes.6.desc"
      from="The Interrupt Level of <ct color=#FFFFFF>Basic Attack: Enchanted Moonlit Blossoms</ct> is greatly increased"
      to="100%."
    />
  )
}

function M6ResDescription() {
  return (
    <GameDescSlice
      ns="char_Qingyi_gen"
      key18="mindscapes.6.desc"
      from="When Qingyi hits an enemy with her <ct color=#FFFFFF>Basic Attack: Enchanted Moonlit Blossoms</ct>"
      to="20% for 15s."
    />
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackEnchantedMoonlitBlossoms: [
        {
          type: 'conditional',
          conditional: {
            label: ch('flashConnectCond'),
            description: <FlashConnectDescription />,
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
          type: 'conditional',
          conditional: {
            label: ch('chainCond'),
            description: <ChainDescription />,
            metadata: cond.chain_subjugation,
            fields: [fieldForBuff(buff.chain_dmg_)],
            linked: ['subjugation'],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('subjugationCond'),
        description: <CoreDescription />,
        metadata: cond.subjugation,
        fields: [fieldForBuff(buff.core_stun_)],
        linked: ['chain_subjugation'],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [
        fieldForBuff(buff.ability_basic_dazeInc_),
        fieldForBuff(buff.ability_atk),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <M1Description />,
        metadata: cond.m1_flash_max,
        fields: [fieldForBuff(buff.m1_defRed_), fieldForBuff(buff.m1_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2DazeCond'),
        description: <M2DazeDescription />,
        metadata: cond.m2_subjugation_max,
        fields: [fieldForBuff(buff.m2_dazeInc_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: <M6CritDescription />,
      fields: [fieldForBuff(buff.m6_crit_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <M6ResDescription />,
        metadata: cond.moonlit_blossoms_hit,
        fields: [fieldForBuff(buff.m6_resRed_)],
      },
    },
  ],
})

export default sheet
