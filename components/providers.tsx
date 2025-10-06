'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { useEffect, useState } from 'react'
import { AuthHydrator } from '@/components/auth-hydrator'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
            },
        },
    }))

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    if (registration.scope.includes(window.location.origin)) {
                        registration.unregister().catch(() => {
                            // ignore
                        })
                    }
                })
            }).catch(() => {
                // ignore
            })
        }
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <AuthHydrator />
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    )
}
