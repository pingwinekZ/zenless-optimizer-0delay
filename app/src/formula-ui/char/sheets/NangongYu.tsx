import type { CharacterKey } from '../../../consts'
import { NangongYu } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'NangongYu'
const [, ch] = trans('char', key)
const cond = NangongYu.conditionals
const buff = NangongYu.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateMeteorShower: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_NangongYu_gen"
                key18="chain.UltimateMeteorShower.desc"
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.core_etherVeil_atk)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_anomProf') },
      fields: [fieldForBuff(buff.core_anomProf)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_impact') },
      fields: [fieldForBuff(buff.core_impact)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('dazeSquadBuffCond'),
        description: <CoreGameDesc characterKey={key} paragraph={6} />,
        metadata: cond.dazeSquadBuff,
        fields: [
          fieldForBuff(buff.core_daze_),
          fieldForBuff(buff.core_squad_dmg_),
        ],
      },
    },
  ],
  ability: [],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1ResIgnCond'),
        description: (
          <GameDesc ns="char_NangongYu_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.m1ResIgn,
        fields: [fieldForBuff(buff.m1_resIgn_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_anomProf') },
      fields: [fieldForBuff(buff.m4_anomProf)],
    },
  ],
  m6: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m6_daze_)],
    },
  ],
})

export default sheet
