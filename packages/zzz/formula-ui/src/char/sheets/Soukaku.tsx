import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { Soukaku } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { AbilityBodyText, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Soukaku'
const ns = 'char_Soukaku_gen'
const [, ch] = trans('char', key)
const cond = Soukaku.conditionals
const buff = Soukaku.buffs

function CoreBaseDescription() {
  const char = useCharacter(key)
  const coreKey = `core.desc.${char?.core ?? 0}`
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={coreKey}
        from="When Soukaku launches"
        to="for 22s"
      />
      <div style={{ marginTop: 8 }}>
        <GameDescSlice
          ns={ns}
          key18={coreKey}
          from="This buff can be passed along"
          to="refreshes the duration of the buff"
        />
      </div>
    </>
  )
}

function CoreVortexDescription() {
  const char = useCharacter(key)
  const coreKey = `core.desc.${char?.core ?? 0}`
  return (
    <GameDescSlice ns={ns} key18={coreKey} from="When consuming" to="1,000" />
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateJumboPuddingSlash: [
        {
          type: 'conditional',
          conditional: {
            label: ch('ultCond'),
            description: (
              <>
                <GameDesc
                  ns={ns}
                  key18="chain.UltimateJumboPuddingSlash.desc.0"
                />
                <div style={{ marginBottom: 8 }} />
                <GameDesc
                  ns={ns}
                  key18="chain.UltimateJumboPuddingSlash.desc.1"
                />
                <div style={{ marginBottom: 8 }} />
                <GameDesc
                  ns={ns}
                  key18="chain.UltimateJumboPuddingSlash.desc.2"
                />
              </>
            ),
            metadata: cond.masked,
            fields: [fieldForBuff(buff.ult_crit_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreBaseDescription />,
        metadata: cond.flyTheFlag,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond2'),
        description: <CoreVortexDescription />,
        metadata: cond.vortexConsumed,
        linked: ['vortexConsumed_ability'],
        showInTeammateView: true,
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns={ns} key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.vortexConsumed_ability,
        linked: ['vortexConsumed'],
        fields: [fieldForBuff(buff.ability_ice_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.4.desc" />,
        metadata: cond.flyTheFlagHit,
        fields: [fieldForBuff(buff.m4_ice_resRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.6.desc" />,
        metadata: cond.frostedBanner,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_common_dmg_.tag)}>
                {ch('m6_makingRiceCakes_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_common_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_common_dmg_.tag)}>
                {ch('m6_5050_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_common_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
