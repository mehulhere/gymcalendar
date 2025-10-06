import { create, type StoreApi } from 'zustand'
import { persist } from 'zustand/middleware'

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
    (set, _get, store) => {
      storeRef = store
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        hasHydrated: false,
        isRestoring: false,
        hasAttemptedRestore: false,
        login: (token, user) =>
          set({ accessToken: token, user, isAuthenticated: true, hasAttemptedRestore: true }),
        logout: () =>
          set({ accessToken: null, user: null, isAuthenticated: false, hasAttemptedRestore: true }),
        updateUser: (updatedUser) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updatedUser } : null,
          })),
        setHasHydrated: (state) => set({ hasHydrated: state }),
        setIsRestoring: (state) => set({ isRestoring: state }),
        setHasAttemptedRestore: (state) => set({ hasAttemptedRestore: state }),
      }
    },
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (_state, _error) => {
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
