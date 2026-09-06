import type { CharacterKey } from '../../../consts'
import { Roxy } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Roxy'
const [, ch] = trans('char', key)
const cond = Roxy.conditionals
const buff = Roxy.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.m6_dmg_), fieldForBuff(buff.team_dmg_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('windEnergyCond'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.m6_dmg_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [fieldForBuff(buff.team_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <GameDesc ns="char_Roxy_gen" key18="ability.desc.0" />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.team_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_Roxy_gen" key18="mindscapes.1.desc" />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.m6_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns="char_Roxy_gen" key18="mindscapes.2.desc" />,
        metadata: cond.listConditional,
        fields: [fieldForBuff(buff.team_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Roxy_gen" key18="mindscapes.4.desc" />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.m6_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns="char_Roxy_gen" key18="mindscapes.6.desc" />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.m6_dmg_), fieldForBuff(buff.enemy_defRed_)],
      },
    },
  ],
})

export default sheet
