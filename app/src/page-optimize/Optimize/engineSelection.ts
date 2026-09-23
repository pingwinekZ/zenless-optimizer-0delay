import type { OptimizerEngine } from '@zenless-optimizer/zzz/db'
import { useCallback, useEffect } from 'react'

/**
 * Effective solver engine: WebGPU is the default, but a browser that
 * cannot run it must fall back to the CPU solver instead of silently
 * producing an empty result grid.
 */
export function resolveEngine(
  requested: OptimizerEngine | undefined,
  gpuAvailable: boolean
): OptimizerEngine {
  const req = requested ?? 'gpu'
  return req === 'gpu' && !gpuAvailable ? 'cpu' : req
}

function isGpuAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!(navigator as Navigator & { gpu?: unknown }).gpu
  )
}

type OptConfigsSetter = {
  optConfigs: {
    set: (id: string, value: { engine: OptimizerEngine }) => void
  }
}

/**
 * Engine selection state: resolves the effective engine (with GPU
 * fallback), warns when falling back, and persists user changes.
 */
export function useEngineSelection(
  requestedEngine: OptimizerEngine | undefined,
  optConfigId: string | undefined,
  database: OptConfigsSetter
): {
  engine: OptimizerEngine
  requestedEngine: OptimizerEngine
  setEngine: (engine: OptimizerEngine) => void
} {
  const requested = requestedEngine ?? 'gpu'
  const gpuAvailable = isGpuAvailable()
  const engine = resolveEngine(requestedEngine, gpuAvailable)
  useEffect(() => {
    if (requested === 'gpu' && !gpuAvailable)
      console.warn(
        '[Optimize] WebGPU is unavailable in this browser; using the CPU solver.'
      )
  }, [requested, gpuAvailable])
  const setEngine = useCallback(
    (engine: OptimizerEngine) => {
      if (optConfigId) database.optConfigs.set(optConfigId, { engine })
    },
    [optConfigId, database]
  )
  return { engine, requestedEngine: requested, setEngine }
}
