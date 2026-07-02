export const isDev = import.meta.env.DEV

/**
 * Boolean indicating if dev components should be shown
 */
export const shouldShowDevComponents =
  isDev || import.meta.env['VITE_NX_SHOW_DEV_COMPONENTS'] === 'true'
