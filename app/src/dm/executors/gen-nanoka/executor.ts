import type { PromiseExecutor } from '@nx/devkit'
import { getDataFromNanoka } from './nanoka'
import type { GenNanokaDataExecutorSchema } from './schema'

// import { workspaceRoot } from '@nx/devkit'
// const folderPath = `${workspaceRoot}/libs/zzz/dm/NanokaData`

const runExecutor: PromiseExecutor<GenNanokaDataExecutorSchema> = async (
  options
) => {
  console.log('Running Executor for GenNanokaData', options)
  await getDataFromNanoka()
  return {
    success: true,
  }
}

export default runExecutor
