import i18next from 'i18next'

export function calculateProgressText(
  startTime: number | null,
  optimizerEndTime: number | null,
  _permutations: number,
  permutationsSearched: number,
  optimizationInProgress: boolean,
  optimizerProgress = 0
) {
  if (!startTime) {
    return i18next.t('page_optimize:sidebar.progress', 'Progress')
  }

  let endTime = Date.now()
  if (optimizerEndTime) {
    endTime = optimizerEndTime
  }

  const msDiff = endTime - startTime
  if (
    (!optimizerEndTime && msDiff < 5_000 && optimizerProgress < 0.05) ||
    !permutationsSearched
  ) {
    return i18next.t(
      'page_optimize:sidebar.calculatingETA',
      'Progress (calculating ETA..)'
    )
  }

  const msRemaining =
    optimizerProgress > 0
      ? Math.max(0, (msDiff / optimizerProgress) * (1 - optimizerProgress))
      : 0
  const perSecond = permutationsSearched / (msDiff / 1000)
  return optimizationInProgress
    ? i18next.t('page_optimize:sidebar.timeRemaining', {
        rate: Math.floor(perSecond).toLocaleString(),
        timeRemaining: msToReadable(msRemaining),
        defaultValue: `${Math.floor(perSecond).toLocaleString()} / sec — ${msToReadable(msRemaining)} left`,
      })
    : i18next.t('page_optimize:sidebar.finished', {
        rate: Math.floor(perSecond).toLocaleString(),
        defaultValue: `${Math.floor(perSecond).toLocaleString()} / sec — Finished`,
      })
}

function msToReadable(ms: number): string {
  if (ms < 1000) return '<1s'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}
