import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Gym Tracker',
    description: 'Track your workouts, build plans, and monitor progress',
    manifest: '/manifest.json',
    themeColor: '#10b981',
    icons: {
        icon: '/favicon.ico',
        apple: [
            { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
        other: [
            { url: '/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Gym Tracker',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}


