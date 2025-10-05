'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function AuthHydrator() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const isRestoring = useAuthStore((state) => state.isRestoring)
  const setIsRestoring = useAuthStore((state) => state.setIsRestoring)
  const hasAttemptedRestore = useAuthStore((state) => state.hasAttemptedRestore)
  const setHasAttemptedRestore = useAuthStore((state) => state.setHasAttemptedRestore)

  useEffect(() => {
    if (!hasHydrated || isRestoring || hasAttemptedRestore) {
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        setIsRestoring(true)

        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (!cancelled && data?.accessToken && data?.user) {
          login(data.accessToken, data.user)
        }
      } catch (error) {
        if (!cancelled) {
          logout()
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false)
          setHasAttemptedRestore(true)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [
    hasHydrated,
    hasAttemptedRestore,
    login,
    logout,
    setIsRestoring,
    setHasAttemptedRestore,
  ])

  return null
}
