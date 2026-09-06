import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Roxy'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackDoStayAWhile:
      data_gen.skillParams['basic']['BasicAttackDoStayAWhile'],
  },
  dodge: {
    DodgeExcuseMe: data_gen.skillParams['dodge']['DodgeExcuseMe'],
    DashAttackForgiveMyRudeness:
      data_gen.skillParams['dodge']['DashAttackForgiveMyRudeness'],
    DodgeCounterReturnedCourtesy:
      data_gen.skillParams['dodge']['DodgeCounterReturnedCourtesy'],
  },
  special: {
    SpecialAttackForgiveMeForNotSeeingYouOff:
      data_gen.skillParams['special'][
        'SpecialAttackForgiveMeForNotSeeingYouOff'
      ],
    SpecialAttackMuchObliged:
      data_gen.skillParams['special']['SpecialAttackMuchObliged'],
    EXSpecialAttackDontCatchAChill:
      data_gen.skillParams['special']['EXSpecialAttackDontCatchAChill'],
    EXSpecialAttackKindlyRestInPeace:
      data_gen.skillParams['special']['EXSpecialAttackKindlyRestInPeace'],
    StormsEye: data_gen.skillParams['special']['StormsEye'],
  },
  chain: {
    ChainAttackGaleBurialGreatHammer:
      data_gen.skillParams['chain']['ChainAttackGaleBurialGreatHammer'],
    UltimateRequiemForTheNightBurial:
      data_gen.skillParams['chain']['UltimateRequiemForTheNightBurial'],
  },
  assist: {
    AssistMoreOvertime: data_gen.skillParams['assist']['AssistMoreOvertime'],
    QuickAssistAtYourService:
      data_gen.skillParams['assist']['QuickAssistAtYourService'],
    DefensiveAssistAllowMeToAssist:
      data_gen.skillParams['assist']['DefensiveAssistAllowMeToAssist'],
    AssistFollowUpMidnightCode:
      data_gen.skillParams['assist']['AssistFollowUpMidnightCode'],
  },
} as const

export default dm
