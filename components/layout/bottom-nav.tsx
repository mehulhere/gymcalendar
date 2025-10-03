'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, ListChecks, Dumbbell, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
            <div className="relative mx-3 mb-3 rounded-3xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

                <div className="relative flex justify-around items-center h-16 px-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className="relative flex flex-col items-center justify-center flex-1 h-full touch-target group"
                            >
                                {/* Active indicator background with animation */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNavItem"
                                        className="absolute inset-0 mx-1 gradient-emerald rounded-2xl"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30
                                        }}
                                    />
                                )}

                                {/* Content */}
                                <div className={cn(
                                    "relative z-10 flex flex-col items-center gap-0.5 transition-all duration-300",
                                    isActive && "scale-110"
                                )}>
                                    <Icon className={cn(
                                        "h-5 w-5 transition-colors duration-300",
                                        isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                                    )} />
                                    <span className={cn(
                                        "text-[10px] font-semibold transition-colors duration-300",
                                        isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {item.label}
                                    </span>
                                </div>

                                {/* Glow effect for active item */}
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl -z-10"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}