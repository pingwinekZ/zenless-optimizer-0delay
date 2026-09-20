import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Corin } from '@zenless-optimizer/zzz/formula'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Corin'
const [, ch] = trans('char', key)
const cond = Corin.conditionals
const buff = Corin.buffs
const formula = Corin.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      description: <CoreGameDesc characterKey={key} />,
      header: { icon: null, text: ch('core_dmg_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_wipeout_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_oopsyDaisy_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_nope_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_cleanSweep_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_skirtAlert_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_sorry_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_veryVerySorry_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_emergencyMeasures_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
              {ch('core_quickSweep_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_common_dmg_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      description: (
        <>
          <GameDesc ns="char_Corin_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Corin_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      header: { icon: null, text: ch('ability_header') },
      fields: [fieldForBuff(buff.ability_common_dmg_)],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_Corin_gen" key18="mindscapes.1.desc" />,
        metadata: cond.chain_ult_hit,
        fields: [fieldForBuff(buff.m1_common_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns="char_Corin_gen" key18="mindscapes.2.desc" />,
        metadata: cond.exSpecial_chain_ult_hits,
        fields: [fieldForBuff(buff.m2_physical_resRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <>
            <GameDesc ns="char_Corin_gen" key18="mindscapes.6.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Corin_gen" key18="mindscapes.6.desc.1" />
          </>
        ),
        metadata: cond.charge,
        fields: [
          {
            title: (
              <ColorText color={getVariant(formula.m6_dmg.tag)}>
                {ch('m6_additional_dmg')}
              </ColorText>
            ),
            fieldRef: formula.m6_dmg.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
