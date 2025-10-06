/*
  Lightweight debug logger for client and server.
  Enable by setting `NEXT_PUBLIC_DEBUG_AUTH=1` (or any truthy value).
  In development, logs are enabled by default unless `NEXT_PUBLIC_DEBUG_AUTH=0`.
*/

const DEBUG_FLAG = process.env.NEXT_PUBLIC_DEBUG_AUTH
const IS_DEV = process.env.NODE_ENV !== 'production'

// Enable in dev unless explicitly disabled; in prod only if explicitly enabled
const DEBUG_ENABLED = IS_DEV ? DEBUG_FLAG !== '0' : DEBUG_FLAG === '1' || DEBUG_FLAG === 'true'

export function authDebug(...args: unknown[]) {
  if (!DEBUG_ENABLED) return
  // eslint-disable-next-line no-console
  console.log('[auth]', ...args)
}

export function warnOnce(scope: string, message: string, ...args: unknown[]) {
  if (!DEBUG_ENABLED) return
  // eslint-disable-next-line no-console
  console.warn(`[${scope}]`, message, ...args)
}

