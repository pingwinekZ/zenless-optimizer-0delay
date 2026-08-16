import { imageDataToCanvas } from '@zenless-optimizer/common/img-util'
import { BorrowManager } from '@zenless-optimizer/common/util'
import type { RecognizeResult, Scheduler } from 'tesseract.js'
import { createScheduler, createWorker } from 'tesseract.js'

const workerCount = 2

const schedulers = new BorrowManager(
  async (language): Promise<Scheduler> => {
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
