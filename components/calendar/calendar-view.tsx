'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ModernCalendar } from '@/components/calendar/modern-calendar'
import { HeatmapCalendar } from '@/components/calendar/heatmap-calendar'
import { TargetWeightModal } from '@/components/onboarding/target-weight-modal'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Grid3x3 } from 'lucide-react'
import { readCache, writeCache } from '@/lib/utils/cache'

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

type ViewMode = 'month' | 'heatmap'

export function CalendarView() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const accessToken = useAuthStore((state) => state.accessToken)
    const user = useAuthStore((state) => state.user)
    const hasHydrated = useAuthStore((state) => state.hasHydrated)
    const isRestoring = useAuthStore((state) => state.isRestoring)
    const hasAttemptedRestore = useAuthStore((state) => state.hasAttemptedRestore)
    const router = useRouter()
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [showTargetModal, setShowTargetModal] = useState(false)
    const [userSettings, setUserSettings] = useState<any>(null)

    useEffect(() => {
        const cachedCalendar = readCache<CalendarDay[]>('calendar:data')
        if (cachedCalendar) {
            setCalendarData(cachedCalendar.value)
        }

        const cachedSettings = readCache<any>('user:settings')
        if (cachedSettings) {
            setUserSettings(cachedSettings.value)
            if (!cachedSettings.value?.targetWeight || !cachedSettings.value?.targetDays) {
                setShowTargetModal(true)
            }
        }
    }, [])

    useEffect(() => {
        if (!hasHydrated || isRestoring || !hasAttemptedRestore) {
            return
        }

        if (!isAuthenticated) {
            router.push('/auth/login')
        }
    }, [hasHydrated, hasAttemptedRestore, isAuthenticated, isRestoring, router])

    const fetchUserSettings = useCallback(async () => {
        try {
            const response = await fetch('/api/user/settings', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setUserSettings(data.settings)
                writeCache('user:settings', data.settings)

                // Show target weight modal if not set
                if (!data.settings.targetWeight || !data.settings.targetDays) {
                    setShowTargetModal(true)
                } else {
                    setShowTargetModal(false)
                }
            }
        } catch (error) {
            console.error('Failed to fetch user settings:', error)
        }
    }, [accessToken])

    const fetchCalendarData = useCallback(async () => {
        setIsLoading(true)
        try {
            const currentMonth = format(new Date(), 'yyyy-MM')
            const response = await fetch(`/api/attendance/calendar?month=${currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setCalendarData(data.calendar || [])
                writeCache('calendar:data', data.calendar || [])
            }
        } catch (error) {
            console.error('Failed to fetch calendar data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        if (!hasAttemptedRestore || isRestoring) {
            return
        }

        if (isAuthenticated && accessToken) {
            fetchCalendarData()
            fetchUserSettings()
        }
    }, [
        isAuthenticated,
        accessToken,
        hasAttemptedRestore,
        isRestoring,
        fetchCalendarData,
        fetchUserSettings,
    ])

    if (!hasHydrated || isRestoring || !hasAttemptedRestore) {
        return null
    }

    if (!isAuthenticated) {
        return null
    }

    if (showTargetModal) {
        return (
            <>
                <TargetWeightModal onComplete={() => {
                    setShowTargetModal(false)
                    fetchUserSettings()
                }} />
                <div className="flex flex-col min-h-screen pb-20 bg-gradient-to-b from-background to-muted/20">
                    <BottomNav />
                </div>
            </>
        )
    }

    const getDateStatus = (day: Date): CalendarDay | undefined => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return calendarData.find(d => d.date === dateStr)
    }

    const handleCheckIn = async () => {
        if (!date || !user) return

        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date.toISOString(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Check-in failed')
            }

            toast({
                title: 'Checked in!',
                description: data.suggestMakeup
                    ? 'This is an extra session. You can assign it as a make-up.'
                    : 'Successfully checked in for today.',
            })

            // Refresh calendar data
            await fetchCalendarData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to check in',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 animate-scale-in">
                {/* Minimalist Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent">
                                        Hello,
                                    </span>
                                    {' '}
                                    <span className="text-foreground">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                </h1>
                            </div>
                            <p className="text-sm md:text-base text-muted-foreground font-medium">
                                Let&apos;s crush today&apos;s goals 💪
                            </p>
                        </div>

                        {/* View Mode Toggle - Redesigned */}
                        <div className="flex items-center gap-2 p-1.5 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
                            <button
                                onClick={() => setViewMode('month')}
                                className={`
                                    relative px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300
                                    ${viewMode === 'month'
                                        ? 'text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }
                                `}
                            >
                                {viewMode === 'month' && (
                                    <div className="absolute inset-0 gradient-emerald rounded-xl" />
                                )}
                                <div className="relative z-10 flex items-center gap-1.5">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Month</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setViewMode('heatmap')}
                                className={`
                                    relative px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300
                                    ${viewMode === 'heatmap'
                                        ? 'text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }
                                `}
                            >
                                {viewMode === 'heatmap' && (
                                    <div className="absolute inset-0 gradient-emerald rounded-xl" />
                                )}
                                <div className="relative z-10 flex items-center gap-1.5">
                                    <Grid3x3 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Heatmap</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Card - Enhanced */}
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-10 blur-2xl" />

                    {/* Main card */}
                    <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-5 md:p-8 border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                        {viewMode === 'month' ? (
                            <ModernCalendar
                                calendarData={calendarData}
                                selectedDate={date}
                                onDateSelect={setDate}
                                onCheckIn={handleCheckIn}
                            />
                        ) : (
                            <HeatmapCalendar
                                calendarData={calendarData}
                                selectedDate={date}
                                onDateSelect={setDate}
                                onCheckIn={handleCheckIn}
                            />
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
