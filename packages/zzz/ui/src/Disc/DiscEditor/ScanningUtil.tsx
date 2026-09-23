import { imageDataToCanvas } from '@zenless-optimizer/common/img-util'
import { BorrowManager } from '@zenless-optimizer/common/util'
import type { RecognizeResult, Scheduler } from 'tesseract.js'

const workerCount = 2

// tesseract.js is several MB (7 MB as a pre-bundled dep in dev, its own chunk
// in prod) and only screenshot scanning needs it. Importing it at module scope
// dragged it into every page that mounts `DiscEditorModal` — including the
// optimize and discs pages, which pay it on load whether or not a scan is ever
// started. Load it when a scan actually begins instead.
let tesseractMod: Promise<typeof import('tesseract.js')> | undefined
function loadTesseract() {
  return (tesseractMod ??= import('tesseract.js'))
}

const schedulers = new BorrowManager(
  async (language): Promise<Scheduler> => {
    const { createScheduler, createWorker } = await loadTesseract()
    const scheduler = createScheduler()
    const promises = Array(workerCount)
      .fill(0)
      .map(async (_) => {
        const worker = await createWorker(language)
        scheduler.addWorker(worker)
      })

    await Promise.any(promises)
    return scheduler
  },
  (_language, value) => {
    value.then((value) => value.terminate())
  }
)

export async function textsFromImage(
  imageData: ImageData,
  options: object | undefined = undefined
): Promise<string[]> {
  const canvas = imageDataToCanvas(imageData)
  const rec = await schedulers.borrow(
    'eng',
    async (scheduler) =>
      (await (
        await scheduler
      ).addJob('recognize', canvas, options)) as RecognizeResult
  )
  return (rec.data.blocks ?? []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => line.text)
    )
  )
}
