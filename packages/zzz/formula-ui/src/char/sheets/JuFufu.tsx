import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { JuFufu } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'JuFufu'
const [, ch] = trans('char', key)
const cond = JuFufu.conditionals
const buff = JuFufu.buffs
const formula = JuFufu.formulas

// Impact sentence only, sliced out of the level-scaled core paragraph so the
// value tracks the core level (25→50) instead of a hardcoded number.
function ImpactDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return (
    <GameDescSlice
      ns="char_JuFufu_gen"
      key18={`core.desc.${coreLevel}.3`}
      from="While Ju Fufu"
      to="Impact increases by"
    />
  )
}

// M2 augments the ATK→CD effect, so its line is appended to the parent
// description (§3.12) and its value is folded into the parent buff (§3.10).
function TigersRoarAtkDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={1} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_JuFufu_gen"
          key18="mindscapes.2.desc"
          from="While in the"
          to="additional 22%."
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  // Tiger's Roar state is split into 3 conditionals (ATK→CD, DMG, Impact,
  // plus M4 CD), all linked so toggling any one flips the rest — they
  // describe the same Tiger's Roar buff state, just grouped by which stats
  // they grant. M2 CD is folded into the ATK→CD buff since both grant team
  // CRIT DMG.
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarAtkToCdCond'),
        description: <TigersRoarAtkDescription />,
        metadata: cond.tigers_roar_atkToCd,
        fields: [fieldForBuff(buff.core_crit_dmg_)],
        linked: ['tigers_roar_dmg', 'tigers_roar_impact', 'tigers_roar_m4_cd'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarDmgCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.tigers_roar_dmg,
        fields: [
          fieldForBuff(buff.core_chain_dmg_),
          fieldForBuff(buff.core_ult_dmg_),
        ],
        linked: [
          'tigers_roar_atkToCd',
          'tigers_roar_impact',
          'tigers_roar_m4_cd',
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarImpactCond'),
        description: <ImpactDescription />,
        metadata: cond.tigers_roar_impact,
        fields: [fieldForBuff(buff.core_impact)],
        linked: ['tigers_roar_atkToCd', 'tigers_roar_dmg', 'tigers_roar_m4_cd'],
      },
    },
  ],
  // Ability (Aura of Authority) is Decibel economy — unmodeled by the engine.
  ability: [],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: (
        <GameDescSlice
          ns="char_JuFufu_gen"
          key18="mindscapes.1.desc"
          from="Upon entering combat"
          to="gains 100"
        />
      ),
      fields: [fieldForBuff(buff.m1_crit_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1StunCond'),
        description: (
          <GameDescSlice
            ns="char_JuFufu_gen"
            key18="mindscapes.1.desc"
            from="When Ju Fufu's"
            to="30s."
          />
        ),
        metadata: cond.m1_chain_stun,
        fields: [fieldForBuff(buff.m1_stun_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarM4CdCond'),
        description: (
          <GameDesc ns="char_JuFufu_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.tigers_roar_m4_cd,
        fields: [fieldForBuff(buff.m4_crit_dmg_)],
        linked: [
          'tigers_roar_atkToCd',
          'tigers_roar_dmg',
          'tigers_roar_impact',
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_JuFufu_gen"
          key18="mindscapes.6.desc"
          from="Ju Fufu's"
          to="by 30%."
        />
      ),
      fields: [fieldForBuff(buff.m6_chain_dmg_)],
    },
    {
      // M6: 3 popcorns, each 160% of ATK, treated as Chain Attack DMG.
      type: 'fields',
      header: { icon: null, text: ch('m6_dmg') },
      description: (
        <GameDescSlice
          ns="char_JuFufu_gen"
          key18="mindscapes.6.desc"
          from="Upon consuming"
          to="treated as"
        />
      ),
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
