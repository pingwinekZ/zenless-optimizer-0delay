import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Phoenix } from '@zenless-optimizer/zzz/formula'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Phoenix'
const [, ch] = trans('char', key)
const cond = Phoenix.conditionals
const buff = Phoenix.buffs
const formula = Phoenix.formulas

/**
 * Core Passive · Sear anomaly-crit description, with the M1 +25% CRIT DMG
 * line appended and dimmed until M1 is unlocked (the value is folded into
 * `core_sear_anom_crit_dmg_` via `cmpGE(char.mindscape, 1, ...)`).
 */
function SearCritDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={1} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDesc ns="char_Phoenix_gen" key18="mindscapes.1.desc.1" />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_anomProf') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [fieldForBuff(buff.core_anomProf)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('searCond'),
        description: <SearCritDescription />,
        metadata: cond.sear,
        linked: ['sear_ability', 'sear_m2'],
        fields: [
          fieldForBuff(buff.core_sear_anom_crit_),
          fieldForBuff(buff.core_sear_anom_crit_dmg_),
        ],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('searDoTHeader') },
      description: <CoreGameDesc characterKey={key} paragraph={2} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_sear_dmg.tag)}>
              {ch('core_sear_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_sear_dmg.tag,
        },
      ],
    },
  ],

  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('searAbilityCond'),
        description: (
          <>
            <GameDesc ns="char_Phoenix_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Phoenix_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.sear_ability,
        linked: ['sear', 'sear_m2'],
        fields: [fieldForBuff(buff.ability_sear_crit_dmg_)],
      },
    },
  ],

  perSkillAbility: {
    basic: {
      BasicAttackPurifyingFlame: [
        {
          type: 'fields',
          header: { icon: null, text: ch('abloom_header') },
          description: ch('abloom_desc'),
          fields: [fieldForBuff(buff.core_abloom_crit_dmg_)],
        },
      ],
    },
  },

  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('searM2Cond'),
        description: (
          <GameDesc ns="char_Phoenix_gen" key18="mindscapes.2.desc.1" />
        ),
        metadata: cond.sear_m2,
        linked: ['sear', 'sear_ability'],
        fields: [fieldForBuff(buff.m2_sear_dmg_)],
      },
    },
  ],

  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_resIgn_header') },
      description: (
        <GameDesc ns="char_Phoenix_gen" key18="mindscapes.6.desc.0" />
      ),
      fields: [fieldForBuff(buff.m6_all_resIgn_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_abloom_header') },
      description: (
        <GameDesc ns="char_Phoenix_gen" key18="mindscapes.6.desc.2" />
      ),
      fields: [fieldForBuff(buff.m6_abloom_defIgn_)],
    },
  ],
})

export default sheet
