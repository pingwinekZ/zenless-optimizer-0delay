import type { ExecutorContext } from '@nx/devkit'

import executor from './executor'
import type { GenNanokaDataExecutorSchema } from './schema'

const options: GenNanokaDataExecutorSchema = {}
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
}

describe('GenNanokaData Executor', () => {
  it.skip('can run', async () => {
    const output = await executor(options, context)
    expect(output.success).toBe(true)
  })
})
