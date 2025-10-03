'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, ListChecks, Dumbbell, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { icon: Calendar, label: 'Calendar', href: '/' },
    { icon: ListChecks, label: 'Plans', href: '/plans' },
    { icon: Dumbbell, label: 'Workout', href: '/workout' },
    { icon: BarChart3, label: 'Stats', href: '/stats' },
    { icon: User, label: 'Profile', href: '/profile' },
]

export function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full touch-target",
                                "transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}


