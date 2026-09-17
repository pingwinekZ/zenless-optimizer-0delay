import {
  runTheoryPipeline,
  type TheoryPipelineInput,
  type TheoryPipelineOutput,
  type TheoryStage,
} from './theoryPipeline'

export type TheoryWorkerResponse =
  | { ty: 'stage'; stage: TheoryStage }
  | { ty: 'ok'; out: TheoryPipelineOutput }
  | { ty: 'err'; msg: string }

declare function postMessage(
  res: TheoryWorkerResponse,
  transfer?: Transferable[]
): void

/**
 * Worker entry for the theoretical-max recipe pipeline. Runs recipe generation
 * followed by pruning on this thread, so a wide configuration (millions of
 * recipes, seconds to tens of seconds of work) never blocks the UI.
 */
onmessage = ({ data }: MessageEvent<TheoryPipelineInput>) => {
  try {
    const out = runTheoryPipeline(data, (stage) =>
      postMessage({ ty: 'stage', stage })
    )
    // Hand the descriptor index over zero-copy; it is the one large result the
    // caller genuinely needs (the recipe candidates are the small one).
    postMessage({ ty: 'ok', out }, [out.recipeIndex.buffer as ArrayBuffer])
  } catch (error) {
    postMessage({ ty: 'err', msg: `${error}` })
  }
}
