import {
  runTheoryPipeline,
  type TheoryPipelineInput,
  type TheoryPipelineOutput,
  type TheoryStage,
} from './theoryPipeline'
import type { TheoryWorkerResponse } from './theoryWorker'

export interface TheoryPipelineHandle {
  result: Promise<TheoryPipelineOutput>
  /** Abort the run. Rejects `result` (idempotent). */
  cancel: (reason?: unknown) => void
}

/**
 * Run the theoretical-max pipeline (`runTheoryPipeline`) in a worker.
 *
 * Recipe generation and pruning are both synchronous, CPU-bound and can run for
 * seconds to tens of seconds on a wide configuration. On the main thread that is
 * a frozen page with no feedback; in a worker the UI keeps painting and the run
 * stays cancellable, and only the small survivor set comes back.
 */
export function runTheoryPipelineInWorker(
  input: TheoryPipelineInput,
  onStage?: (stage: TheoryStage) => void
): TheoryPipelineHandle {
  let worker: Worker | undefined
  let cancel: (reason?: unknown) => void = () => {}

  const result = new Promise<TheoryPipelineOutput>((resolve, reject) => {
    cancel = (reason) => {
      worker?.terminate()
      worker = undefined
      reject(reason ?? new Error('theory pipeline cancelled'))
    }

    // No Worker in this host (unit tests, SSR). Run the same core inline: the
    // results are identical, only the (here irrelevant) threading differs.
    if (typeof Worker === 'undefined') {
      try {
        resolve(runTheoryPipeline(input, onStage))
      } catch (e) {
        reject(e)
      }
      return
    }

    const spawned = new Worker(new URL('./theoryWorker.ts', import.meta.url), {
      type: 'module',
    })
    worker = spawned
    const done = () => {
      spawned.terminate()
      if (worker === spawned) worker = undefined
    }
    spawned.onmessage = ({ data }: MessageEvent<TheoryWorkerResponse>) => {
      if (data.ty === 'stage') {
        onStage?.(data.stage)
        return
      }
      done()
      if (data.ty === 'ok') resolve(data.out)
      else reject(new Error(data.msg))
    }
    spawned.onerror = (e) => {
      done()
      reject(e)
    }
    spawned.postMessage(input)
  })

  return { result, cancel }
}
