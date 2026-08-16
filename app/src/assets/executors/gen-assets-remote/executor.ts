import { workspaceRoot } from '@nx/devkit'
import { generateIndexFromObj } from '@zenless-optimizer/common/pipeline'
import { crawlObject, layeredAssignment } from '@zenless-optimizer/common/util'
import * as fs from 'fs'
import * as path from 'path'
import { AssetData } from '../../../assets-data'
import type { GenAssetsRemoteExecutorSchema } from './schema'

const URL_BASE = 'https://static.nanoka.cc/assets/zzz/'
const CONCURRENCY = 16
const DEST_PROJ_PATH = `${workspaceRoot}/app/src/assets` as const
const CATEGORY_DIRS = ['chars', 'discs', 'wengines', 'monsters'] as const

/** Reads the boss monster image names used by the optimizer pages. */
function getMonsterNames(): string[] {
  const names = new Set<string>()
  const seasonFiles = ['shiyuSeasons_gen.json', 'daSeasons_gen.json'] as const
  for (const file of seasonFiles) {
    const seasonPath = `${workspaceRoot}/app/src/page-optimize/${file}`
    if (!fs.existsSync(seasonPath)) {
      console.warn('Cannot find season data', seasonPath)
      continue
    }
    const seasons = JSON.parse(fs.readFileSync(seasonPath, 'utf-8')) as Array<{
      rooms?: Array<{ bigMonster?: { image?: string } }>
      zones?: Array<{ monsterImage?: string }>
    }>
    for (const season of seasons) {
      for (const room of season.rooms ?? [])
        if (room.bigMonster?.image) names.add(room.bigMonster.image)
      for (const zone of season.zones ?? [])
        if (zone.monsterImage) names.add(zone.monsterImage)
    }
  }
  return [...names]
}

async function downloadFile(url: string, dest: string) {
  const res = await fetch(url)
  if (!res.ok) {
    console.warn('Failed to download', url, 'with status', res.status)
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

async function downloadWithConcurrency(tasks: Array<() => Promise<void>>) {
  let index = 0
  async function worker() {
    while (index < tasks.length) {
      const task = tasks[index++]
      await task()
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

export default async function runExecutor(
  options: GenAssetsRemoteExecutorSchema
): Promise<{ success: boolean }> {
  console.log('Running Executor for GenAssetsRemote', options)

  // Start from a clean slate to remove stale files (e.g. old .png files)
  for (const dir of CATEGORY_DIRS) {
    fs.rmSync(`${DEST_PROJ_PATH}/gen/${dir}`, { recursive: true, force: true })
  }

  // Download all assets and collect the index structure.
  // AssetData entries are .png names, but the remote server serves .webp files.
  const indexData = {}
  const downloadTasks: Array<() => Promise<void>> = []
  crawlObject(
    AssetData,
    [],
    (s) => typeof s === 'string',
    (filename: string, keys) => {
      const [category, key, assetName] = keys
      const url = `${URL_BASE}${filename.replace(/\.png$/, '.webp')}`
      const dest = `${DEST_PROJ_PATH}/gen/${category}/${key}/${assetName}.webp`
      downloadTasks.push(() => downloadFile(url, dest))
      layeredAssignment(indexData, keys, assetName)
    }
  )

  // Download boss monster images used by the Shiyu Defense / Deadly Assault pages.
  const monsterNames = getMonsterNames()
  for (const name of monsterNames) {
    const url = `${URL_BASE}Monster_${name}.webp`
    const dest = `${DEST_PROJ_PATH}/gen/monsters/${name}.webp`
    downloadTasks.push(() => downloadFile(url, dest))
  }

  await downloadWithConcurrency(downloadTasks)

  // Only register monsters whose images actually downloaded, so the generated
  // index never imports a file that is missing on the CDN.
  for (const name of monsterNames) {
    if (fs.existsSync(`${DEST_PROJ_PATH}/gen/monsters/${name}.webp`))
      layeredAssignment(indexData, ['monsters', name], name)
  }
  await generateIndexFromObj(indexData, `${DEST_PROJ_PATH}/gen`, 'webp')

  return { success: true }
}
