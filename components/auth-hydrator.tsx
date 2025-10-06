'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { authDebug } from '@/lib/utils/logger'

export function AuthHydrator() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const isRestoring = useAuthStore((state) => state.isRestoring)
  const setIsRestoring = useAuthStore((state) => state.setIsRestoring)
  const hasAttemptedRestore = useAuthStore((state) => state.hasAttemptedRestore)
  const setHasAttemptedRestore = useAuthStore((state) => state.setHasAttemptedRestore)

  useEffect(() => {
    // Only attempt restore after hydration, once
    if (!hasHydrated) {
      authDebug('AuthHydrator: waiting for hydration')
      return
    }
    if (hasAttemptedRestore) {
      authDebug('AuthHydrator: restore already attempted; skipping')
      return
    }
    if (isRestoring) {
      authDebug('AuthHydrator: restore in progress; skipping')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const restoreSession = async () => {
      try {
        authDebug('AuthHydrator: starting session restore')
        setIsRestoring(true)

        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          authDebug('AuthHydrator: session fetch failed', response.status)
          return
        }

        const data = await response.json()

        if (!cancelled && data?.accessToken && data?.user) {
          authDebug('AuthHydrator: session restored, logging in')
          login(data.accessToken, data.user)
        } else {
          authDebug('AuthHydrator: no valid session found')
        }
      } catch (error) {
        if (!cancelled) {
          authDebug('AuthHydrator: error during restore', error)
          logout()
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false)
          setHasAttemptedRestore(true)
          authDebug('AuthHydrator: restore finished')
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
      controller.abort()
      authDebug('AuthHydrator: cleanup (aborted)')
    }
  }, [hasHydrated, hasAttemptedRestore, login, logout, setIsRestoring, setHasAttemptedRestore])

  return null
}
