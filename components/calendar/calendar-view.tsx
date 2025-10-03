'use client'

import { useState, useEffect } from 'react'
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

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

type ViewMode = 'month' | 'heatmap'

export function CalendarView() {
    const { isAuthenticated, user, accessToken } = useAuthStore()
    const router = useRouter()
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [showTargetModal, setShowTargetModal] = useState(false)
    const [userSettings, setUserSettings] = useState<any>(null)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            fetchCalendarData()
            fetchUserSettings()
        }
    }, [isAuthenticated, accessToken])

    const fetchUserSettings = async () => {
        try {
            const response = await fetch('/api/user/settings', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setUserSettings(data.settings)

                // Show target weight modal if not set
                if (!data.settings.targetWeight || !data.settings.targetDays) {
                    setShowTargetModal(true)
                }
            }
        } catch (error) {
            console.error('Failed to fetch user settings:', error)
        }
    }

    const fetchCalendarData = async () => {
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
            }
        } catch (error) {
            console.error('Failed to fetch calendar data:', error)
        } finally {
            setIsLoading(false)
        }
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
        <div className="flex flex-col min-h-screen pb-20 bg-gradient-to-b from-background to-muted/20">
            <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
                {/* Header with View Toggle */}
                <div className="flex items-start justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Welcome back, {user?.name}
                        </h1>
                        <p className="text-sm text-muted-foreground hidden md:block">
                            Track your fitness journey and stay consistent
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all
                ${viewMode === 'month'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
              `}
                        >
                            <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">Month</span>
                        </button>
                        <button
                            onClick={() => setViewMode('heatmap')}
                            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all
                ${viewMode === 'heatmap'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
              `}
                        >
                            <Grid3x3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">Heatmap</span>
                        </button>
                    </div>
                </div>

                {/* Calendar Views */}
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-8 border shadow-2xl">
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

            <BottomNav />
        </div>
    )
}

