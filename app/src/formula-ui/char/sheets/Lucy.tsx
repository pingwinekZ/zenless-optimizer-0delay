import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Lucy } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Lucy'
const [, ch] = trans('char', key)
const cond = Lucy.conditionals
const buff = Lucy.buffs
const formula = Lucy.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      CheerOn: [
        {
          type: 'conditional',
          conditional: {
            label: ch('cheerOnCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Lucy_gen"
                key18="special.CheerOn.desc"
              />
            ),
            metadata: cond.cheerOn,
            fields: [fieldForBuff(buff.exSpecial_atk)],
            linked: ['cheerOn_m4'],
          },
        },
      ],
    },
  },
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('cheerOnM4Cond'),
        description: <GameDesc ns="char_Lucy_gen" key18="mindscapes.4.desc" />,
        metadata: cond.cheerOn_m4,
        fields: [fieldForBuff(buff.m4_crit_dmg_)],
        linked: ['cheerOn'],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Lucy_gen"
          key18="mindscapes.6.desc"
          from="When another squad member in the"
          to="300% of the guard boar's ATK"
        />
      ),
      header: { icon: null, text: ch('m6_additional_dmg') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_guard_boar_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
