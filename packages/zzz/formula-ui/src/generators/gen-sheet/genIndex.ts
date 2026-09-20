import type { Tree } from '@nx/devkit'
import { formatText } from '@zenless-optimizer/common/pipeline'
import {
  allCharacterKeys,
  allDiscSetKeys,
  allWengineKeys,
} from '@zenless-optimizer/zzz/consts'
import { writeFileSync } from 'fs'

export default async function genIndex(_tree: Tree, sheet_type: string) {
  const file_location = `packages/zzz/formula-ui/src/${sheet_type}/sheets/index.ts`
  switch (sheet_type) {
    case 'char':
      await writeCharIndex(file_location)
      break
    case 'disc':
      await writeDiscIndex(file_location)
      break
    case 'wengine':
      await writeWengineIndex(file_location)
      break
  }
}

async function writeCharIndex(path: string) {
  const index = `
// WARNING: Generated file, do not modify
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { CharUISheet } from '../consts'
${allCharacterKeys
  .map((charKey) => `import ${charKey} from './${charKey}'`)
  .join('\n')}

export const charSheets: Record<CharacterKey, CharUISheet> = {
  ${allCharacterKeys.join('\n,  ')}
} as const
  `
  const formatted = await formatText('index.ts', index)
  writeFileSync(path, formatted)
}

async function writeDiscIndex(path: string) {
  const index = `
// WARNING: Generated file, do not modify
import type { UISheet } from '@zenless-optimizer/game-opt/sheet-ui'
import type { DiscSetKey } from '@zenless-optimizer/zzz/consts'
${allDiscSetKeys
  .map((setKey) => `import ${setKey} from './${setKey}'`)
  .join('\n')}

export const discUiSheets: Record<DiscSetKey, UISheet<'2' | '4'>> = {
  ${allDiscSetKeys.join('\n,  ')}
}
  `
  const formatted = await formatText('index.ts', index)
  writeFileSync(path, formatted)
}

async function writeWengineIndex(path: string) {
  const index = `
// WARNING: Generated file, do not modify
import type { UISheetElement } from '@zenless-optimizer/game-opt/sheet-ui'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'

${allWengineKeys.map((wkey) => `import ${wkey} from './${wkey}'`).join('\n')}

export const wengineUiSheets: Record<WengineKey, UISheetElement> =
  {
    ${allWengineKeys.join(',\n  ')}
  }
  `
  const formatted = await formatText('index.ts', index)
  writeFileSync(path, formatted)
}
