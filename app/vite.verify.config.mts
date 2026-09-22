// TEMPORARY verification harness — deleted after the check.
import type { UserConfig } from 'vite'
import base from './vite.config.mts'

export default async (env: Record<string, unknown>) => {
  const resolved = (await (typeof base === 'function'
    ? (base as unknown as (e: unknown) => unknown)(env)
    : base)) as UserConfig
  return { ...resolved, cacheDir: '/tmp/vite-verify-cache2' }
}
