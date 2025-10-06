import { create, type StoreApi } from 'zustand'
import { persist } from 'zustand/middleware'
import { authDebug } from '@/lib/utils/logger'

interface User {
  id: string
  email: string
  name: string
  settings: {
    unit: 'kg' | 'lb'
    timezone: string
    equipment: string[]
    theme: 'light' | 'dark' | 'system'
    bodyWeight?: number
    height?: number
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  isRestoring: boolean
  hasAttemptedRestore: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setHasHydrated: (state: boolean) => void
  setIsRestoring: (state: boolean) => void
  setHasAttemptedRestore: (state: boolean) => void
}

let storeRef: StoreApi<AuthState> | undefined

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get, store) => {
      storeRef = store
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        hasHydrated: false,
        isRestoring: false,
        hasAttemptedRestore: false,
        login: (token, user) => {
          authDebug('auth-store: login', { userId: user?.id })
          set({ accessToken: token, user, isAuthenticated: true, hasAttemptedRestore: true })
        },
        logout: () => {
          authDebug('auth-store: logout')
          set({ accessToken: null, user: null, isAuthenticated: false, hasAttemptedRestore: true })
        },
        updateUser: (updatedUser) => {
          authDebug('auth-store: updateUser', Object.keys(updatedUser || {}))
          set((state) => ({
            user: state.user ? { ...state.user, ...updatedUser } : null,
          }))
        },
        setHasHydrated: (state) => {
          if (get().hasHydrated !== state) {
            authDebug('auth-store: setHasHydrated', get().hasHydrated, '->', state)
            set({ hasHydrated: state })
          }
        },
        setIsRestoring: (state) => {
          if (get().isRestoring !== state) {
            authDebug('auth-store: setIsRestoring', get().isRestoring, '->', state)
            set({ isRestoring: state })
          }
        },
        setHasAttemptedRestore: (state) => {
          if (get().hasAttemptedRestore !== state) {
            authDebug('auth-store: setHasAttemptedRestore', get().hasAttemptedRestore, '->', state)
            set({ hasAttemptedRestore: state })
          }
        },
      }
    },
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          authDebug('auth-store: rehydrate error', error)
        } else {
          authDebug('auth-store: rehydrated', {
            hadToken: Boolean(state?.accessToken),
            hadUser: Boolean(state?.user),
          })
        }
        // Ensure a clean base; session will be restored via AuthHydrator
        storeRef?.setState({
          hasHydrated: true,
          hasAttemptedRestore: false,
          isAuthenticated: false,
          accessToken: null,
          user: null,
          isRestoring: false,
        })
      },
    }
  )
)
