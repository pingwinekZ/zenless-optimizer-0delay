import type { Tree } from '@nx/devkit'
import { generateFiles } from '@nx/devkit'
import * as path from 'path'
import type { GenSheetGeneratorSchema } from './schema'

export default async function genSheet(
  tree: Tree,
  options: GenSheetGeneratorSchema,
  verbose = false
): Promise<boolean> {
  const { sheet_type, sheet } = options
  const file_location = `packages/zzz/formula-ui/src/${sheet_type}/sheets`
  const dest = `${file_location}/${sheet}.tsx`
  if (tree.exists(dest)) {
    verbose && console.warn(`Sheet at ${dest} already exists.`)
    return false
  }
  generateFiles(tree, path.join(__dirname, sheet_type), file_location, options)
  return true
}
