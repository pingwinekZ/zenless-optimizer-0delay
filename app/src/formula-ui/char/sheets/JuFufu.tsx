import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { JuFufu } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'JuFufu'
const [, ch] = trans('char', key)
const cond = JuFufu.conditionals
const buff = JuFufu.buffs
const formula = JuFufu.formulas

const sheet = createBaseSheet(key, {
  // Tiger's Roar state is split into 5 conditionals (ATK→CD, DMG, Impact, plus
  // M2/M4 CD), all linked so toggling any one flips all five — they describe the
  // same Tiger's Roar buff state, just grouped by which stats they grant.
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarAtkToCdCond'),
        description: <CoreGameDesc characterKey={key} paragraph={1} />,
        metadata: cond.tigers_roar_atkToCd,
        fields: [fieldForBuff(buff.core_crit_dmg_)],
        linked: [
          'tigers_roar_dmg',
          'tigers_roar_impact',
          'tigers_roar_m2_cd',
          'tigers_roar_m4_cd',
        ],
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
          'tigers_roar_m2_cd',
          'tigers_roar_m4_cd',
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarImpactCond'),
        description: <CoreGameDesc characterKey={key} paragraph={3} />,
        metadata: cond.tigers_roar_impact,
        fields: [fieldForBuff(buff.core_impact)],
        linked: [
          'tigers_roar_atkToCd',
          'tigers_roar_dmg',
          'tigers_roar_m2_cd',
          'tigers_roar_m4_cd',
        ],
      },
    },
  ],
  ability: [],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [fieldForBuff(buff.m1_crit_)],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tigersRoarM2CdCond'),
        description: (
          <GameDesc ns="char_JuFufu_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.tigers_roar_m2_cd,
        fields: [fieldForBuff(buff.m2_crit_dmg_)],
        linked: [
          'tigers_roar_atkToCd',
          'tigers_roar_dmg',
          'tigers_roar_impact',
          'tigers_roar_m4_cd',
        ],
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
          'tigers_roar_m2_cd',
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [fieldForBuff(buff.m6_chain_dmg_)],
    },
    {
      // M6: 3 popcorns, each 160% of ATK, treated as Chain Attack DMG.
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
