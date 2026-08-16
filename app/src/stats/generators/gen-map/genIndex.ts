import type { Tree } from '@nx/devkit'
import { formatText } from '@zenless-optimizer/common/pipeline'
import { writeFileSync } from 'fs'
import {
  allCharacterKeys,
  allDiscSetKeys,
  allWengineKeys,
} from '../../../consts'

export default async function genIndex(_tree: Tree, map_type: string) {
  const file_location = `app/src/stats/mappedStats/${map_type}/index.ts`
  switch (map_type) {
    case 'char':
      await writeIndex(file_location, allCharacterKeys)
      break
    case 'disc':
      await writeIndex(file_location, allDiscSetKeys)
      break
    case 'wengine':
      await writeIndex(file_location, allWengineKeys)
      break
  }
}

async function writeIndex(path: string, keys: readonly string[]) {
  const index = `// WARNING: Generated file, do not modify
${keys.map((key) => `import ${key} from './maps/${key}'`).join('\n')}

const maps = {
  ${keys.join('\n,  ')}
}
export default maps

  `
  const formatted = await formatText(path, index)
  writeFileSync(path, formatted)
}
