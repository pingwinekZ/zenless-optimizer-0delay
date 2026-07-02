import { dumpFile } from '@zenless-optimizer/common/pipeline'
import { existsSync, readdirSync, readFileSync } from 'fs'
import type { GenLocaleExecutorSchema } from './schema'

type ProjNames = 'common' | 'zzz'
export const projRootPath = (cat: ProjNames) =>
  cat === 'common'
    ? `${process.env['NX_WORKSPACE_ROOT']}/packages/${cat}/localization/`
    : `${process.env['NX_WORKSPACE_ROOT']}/app/src/localization/`

export default async function runExecutor(_options: GenLocaleExecutorSchema) {
  const transDirPath = `${projRootPath('common')}Translated/`
  const localeDir = (cat: ProjNames) => `${projRootPath(cat)}assets/locales/`

  if (existsSync(transDirPath)) {
    const files = readdirSync(transDirPath).filter((fn) => fn.includes('.json'))
    files.forEach((file) => {
      const lang = file.split('.json')[0]
      const raw = readFileSync(transDirPath + file).toString()
      const json = JSON.parse(raw)
      Object.entries(json).map(([ns, entry]) => {
        if (ns.startsWith('zzz_')) {
          dumpFile(`${localeDir('zzz')}${lang}/${ns.slice(3)}.json`, entry)
        } else if (ns.startsWith('common_')) {
          dumpFile(`${localeDir('common')}${lang}/${ns.slice(7)}.json`, entry)
        }
      })
    })
  }

  const main = {} as { [key: string]: object }

  function enToMain(enDir: string, prefix = '') {
    if (!existsSync(enDir)) return
    const jsonFiles = readdirSync(enDir).filter((fn) => fn.endsWith('.json'))

    jsonFiles.forEach((jfile) => {
      let filename = jfile.split('.json')[0]
      if (!filename.startsWith(prefix)) filename = prefix + filename
      const raw = readFileSync(enDir + jfile).toString()
      const json = JSON.parse(raw)
      main[filename] = json
    })
  }
  enToMain(`${localeDir('common')}en/`, 'common_')
  enToMain(`${localeDir('zzz')}en/`, 'zzz_')
  dumpFile(`${projRootPath('common')}/main_gen.json`, main)

  return { success: true }
}
