import type { Tree } from '@nx/devkit'
import { formatText } from '@zenless-optimizer/common/pipeline'
import {
  allCharacterKeys,
  allDiscSetKeys,
  allWengineKeys,
} from '@zenless-optimizer/zzz/consts'

export default async function genIndex(tree: Tree, sheet_type: string) {
  const file_location = `packages/zzz/formula-ui/src/${sheet_type}/sheets/index.ts`
  switch (sheet_type) {
    case 'char':
      await writeCharIndex(tree, file_location)
      break
    case 'disc':
      await writeDiscIndex(tree, file_location)
      break
    case 'wengine':
      await writeWengineIndex(tree, file_location)
      break
  }
}

async function writeCharIndex(tree: Tree, path: string) {
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
  tree.write(path, await formatText('index.ts', index))
}

async function writeDiscIndex(tree: Tree, path: string) {
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
  tree.write(path, await formatText('index.ts', index))
}

async function writeWengineIndex(tree: Tree, path: string) {
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
  tree.write(path, await formatText('index.ts', index))
}
