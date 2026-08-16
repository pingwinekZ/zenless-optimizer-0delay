import { dumpFile } from '@zenless-optimizer/common/pipeline'
import type { DiscSetKey } from '../../../../consts'
import { discsDetailedJSONData } from '../../../../dm'
import { processText } from './util'
export function dumpDiscs(fileDir: string) {
  const discNames = {} as Record<DiscSetKey, string>

  Object.entries(discsDetailedJSONData).forEach(([setKey, discData]) => {
    discNames[setKey] = discData.name

    dumpFile(`${fileDir}/disc_${setKey}_gen.json`, {
      name: discData.name,
      desc2: processText(discData.desc2),
      desc4: processText(discData.desc4),
      story: processText(discData.story),
    })
  })
  dumpFile(`${fileDir}/discNames_gen.json`, discNames)
}
