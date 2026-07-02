import { workspaceRoot } from '@nx/devkit'
import { generateIndexFromObj } from '@zenless-optimizer/common/pipeline'
import { crawlObject, layeredAssignment } from '@zenless-optimizer/common/util'
import * as fs from 'fs'
import * as path from 'path'
import { AssetData } from '../../../assets-data'
import { DM2D_PATH } from '../../../dm'
import type { GenAssetsExecutorSchema } from './schema'

const DEST_PROJ_PATH = `${workspaceRoot}/app/src/assets` as const

export default async function runExecutor(
  options: GenAssetsExecutorSchema
): Promise<{ success: boolean }> {
  function copyFile(src: string, dest: string) {
    if (!fs.existsSync(src)) {
      console.warn('Cannot find file', src)
      return
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFile(src, dest, (err) => {
      if (err) console.error(err)
    })
  }

  // Dump out the asset List.
  // Best effort and since most of the time we don't use this
  console.log(options)
  if (options.fetchAssets === 'local' && fs.existsSync(DM2D_PATH)) {
    console.log('Copying files')
    crawlObject(
      AssetData,
      [],
      (s) => typeof s === 'string' || Array.isArray(s),
      (filePath: string | string[], keys) => {
        const fileName = keys.slice(-1)[0]
        const folderPath = keys.slice(0, -1).join('/')
        if (typeof filePath === 'string') {
          copyFile(
            `${DM2D_PATH}/${filePath.toLocaleLowerCase()}`,
            `${DEST_PROJ_PATH}/gen/${folderPath}/${fileName}.png`
          )
        } else {
          filePath.forEach((fp, index) =>
            copyFile(
              `${DM2D_PATH}/${fp.toLocaleLowerCase()}`,
              `${DEST_PROJ_PATH}/gen/${folderPath}/${fileName}_${index}.png`
            )
          )
        }
      }
    )
  } else {
    console.log('No assets will be copied.')
  }
  console.log('Generating index')
  // Extract just the filename for the index files
  const indexData = {}
  crawlObject(
    AssetData,
    [],
    (s) => typeof s === 'string' || Array.isArray(s),
    (filePath: string | string[], keys) => {
      const fileName = keys.slice(-1)[0]
      if (typeof filePath === 'string') {
        layeredAssignment(indexData, keys, fileName)
      } else {
        filePath.forEach((_, index) => {
          const newKeys = [...keys]
          newKeys[newKeys.length - 1] = `${
            newKeys[newKeys.length - 1]
          }_${index}`
          layeredAssignment(indexData, newKeys, `${fileName}_${index}`)
        })
      }
    }
  )
  await generateIndexFromObj(indexData, `${DEST_PROJ_PATH}/gen`)

  // W-engine images are WebP, not PNG. Update generated index files to match.
  const wengineDir = `${DEST_PROJ_PATH}/gen/wengines`
  if (fs.existsSync(wengineDir)) {
    for (const entry of fs.readdirSync(wengineDir)) {
      const indexPath = `${wengineDir}/${entry}/index.ts`
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf-8')
        if (content.includes('.png')) {
          content = content.replace(/\.png/g, '.webp')
          fs.writeFileSync(indexPath, content, 'utf-8')
        }
      }
    }
  }

  return { success: true }
}
