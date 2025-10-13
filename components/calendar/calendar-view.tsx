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
import { format, startOfWeek, addDays } from 'date-fns'
import { subMonths as subMonthsDate } from 'date-fns'
import { isToday, isYesterday } from 'date-fns'
import { Calendar as CalendarIcon, Grid3x3 } from 'lucide-react'
import { readCache, writeCache } from '@/lib/utils/cache'

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

type WeeklyHighlight = { weekStart: string; achieved: boolean }

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
    const [didRedirect, setDidRedirect] = useState(false)
    const [weeklyHighlights, setWeeklyHighlights] = useState<WeeklyHighlight[]>([])
    const [suggestedWeekHighlights, setSuggestedWeekHighlights] = useState<string[]>([])
    const [goldenDots, setGoldenDots] = useState<string[]>([])
    const [streakDays, setStreakDays] = useState<number>(0)

    useEffect(() => {
        const cachedCalendar = readCache<CalendarDay[]>('calendar:data')
        if (cachedCalendar) {
            setCalendarData(cachedCalendar.value)
        }

        const cachedSettings = readCache<any>('user:settings')
        if (cachedSettings) {
            setUserSettings(cachedSettings.value)
            if (!cachedSettings.value?.targetWeight || !cachedSettings.value?.targetDays || !cachedSettings.value?.weeklyTargetDays) {
                setShowTargetModal(true)
            }
        }
    }, [])

    // Redirect unauthenticated users to login after hydration + restore attempt
    useEffect(() => {
        if (didRedirect) return
        if (!hasHydrated) return
        if (isRestoring) return
        if (!hasAttemptedRestore) return

        if (!isAuthenticated) {
            setDidRedirect(true)
            router.replace('/auth/login')
        }
    }, [didRedirect, hasHydrated, hasAttemptedRestore, isRestoring, isAuthenticated, router])

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
                if (!data.settings.targetWeight || !data.settings.targetDays || !data.settings.weeklyTargetDays) {
                    setShowTargetModal(true)
                } else {
                    setShowTargetModal(false)
                }
            }
        } catch (error) {
            console.error('Failed to fetch user settings:', error)
        }
    }, [accessToken])

    const fetchCalendarData = useCallback(async (forDate?: Date) => {
        setIsLoading(true)
        try {
            const target = forDate ?? new Date()
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

            // Lightweight cache with 2h TTL and burst refresh rule (every 2nd refresh within same minute)
            const bundleKey = 'calendar:bundle'
            const minuteKey = 'calendar:lastMinute'
            const countKey = 'calendar:minuteCount'
            const now = new Date()
            const currentMinute = format(now, 'yyyyMMddHHmm')

            let minuteCount = 1
            try {
                const lastMinute = window.localStorage.getItem(minuteKey)
                const rawCount = window.localStorage.getItem(countKey)
                if (lastMinute === currentMinute && rawCount) {
                    minuteCount = Math.max(1, parseInt(rawCount, 10) + 1)
                }
                window.localStorage.setItem(minuteKey, currentMinute)
                window.localStorage.setItem(countKey, String(minuteCount))
            } catch { }

            const forceBurstRefresh = minuteCount % 2 === 0
            const cached = readCache<any>(bundleKey)
            const twoHoursMs = 2 * 60 * 60 * 1000
            const isCacheValid = !!cached && (Date.now() - cached.timestamp) < twoHoursMs

            if (isCacheValid && !forceBurstRefresh) {
                const { calendar, highlights, suggested, golden } = cached.value || {}
                setCalendarData(calendar || [])
                setWeeklyHighlights(highlights || [])
                setSuggestedWeekHighlights(suggested || [])
                setGoldenDots(golden || [])
                // Re-derive streak from cached highlights/calendar
                const mergedCalendar = calendar || []
                const mergedHighlights = highlights || []
                const calendarMap = new Map<string, CalendarDay>(mergedCalendar.map((d: CalendarDay) => [d.date, d]))
                const getWeekStartKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                const countAttendedInWeek = (weekStartKey: string): number => {
                    const weekStartDate = new Date(weekStartKey)
                    let c = 0
                    for (let i = 0; i < 7; i++) {
                        const key = format(addDays(weekStartDate, i), 'yyyy-MM-dd')
                        const day = calendarMap.get(key)
                        if (day?.status === 'attended') c++
                    }
                    return c
                }
                const currentWeekKey = getWeekStartKey(new Date())
                let total = countAttendedInWeek(currentWeekKey)
                const highlightIndex = mergedHighlights.findIndex((h: WeeklyHighlight) => h.weekStart === currentWeekKey)
                let idx = highlightIndex === -1 ? mergedHighlights.findIndex((h: WeeklyHighlight) => h.weekStart > currentWeekKey) - 1 : highlightIndex - 1
                if (isNaN(idx)) idx = mergedHighlights.length - 1
                for (let i = idx; i >= 0; i--) {
                    const h = mergedHighlights[i]
                    if (!h.achieved) break
                    total += countAttendedInWeek(h.weekStart)
                }
                setStreakDays(total)
                return
            }

            // Fetch only current and previous month
            const currentMonth = format(target, 'yyyy-MM')
            const previousMonth = format(subMonthsDate(target, 1), 'yyyy-MM')
            const [resCurr, resPrev] = await Promise.all([
                fetch(`/api/attendance/calendar?month=${currentMonth}&timeZone=${encodeURIComponent(tz)}`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`/api/attendance/calendar?month=${previousMonth}&timeZone=${encodeURIComponent(tz)}`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
            ])
            const curr = resCurr.ok ? await resCurr.json() : { calendar: [], weeklyHighlights: [], suggestedWeekHighlights: [], goldenDots: [] }
            const prev = resPrev.ok ? await resPrev.json() : { calendar: [], weeklyHighlights: [], suggestedWeekHighlights: [], goldenDots: [] }

            const mergedByDate: Record<string, CalendarDay> = {}
            const mergedHighlightMap: Record<string, WeeklyHighlight> = {}
            for (const d of [...(curr.calendar || []), ...(prev.calendar || [])]) mergedByDate[d.date] = d
            for (const w of [...(curr.weeklyHighlights || []), ...(prev.weeklyHighlights || [])]) mergedHighlightMap[w.weekStart] = w
            const mergedCalendar = Object.values(mergedByDate).sort((a, b) => a.date.localeCompare(b.date))
            const mergedHighlights = Object.values(mergedHighlightMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
            const allSuggestedWeekHighlights = [...(curr.suggestedWeekHighlights || []), ...(prev.suggestedWeekHighlights || [])]
            const allGoldenDots = Array.from(new Set([...(curr.goldenDots || []), ...(prev.goldenDots || [])]))

            setCalendarData(mergedCalendar)
            setWeeklyHighlights(mergedHighlights)
            setSuggestedWeekHighlights(allSuggestedWeekHighlights)
            setGoldenDots(allGoldenDots)
            writeCache('calendar:weeklyHighlights', mergedHighlights)
            writeCache('calendar:data', mergedCalendar)
            writeCache(bundleKey, {
                calendar: mergedCalendar,
                highlights: mergedHighlights,
                suggested: allSuggestedWeekHighlights,
                golden: allGoldenDots,
            })

            // Compute streak days from merged data
            const calendarMap = new Map<string, CalendarDay>(mergedCalendar.map(d => [d.date, d]))
            const getWeekStartKey = (d: Date) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const countAttendedInWeek = (weekStartKey: string): number => {
                const weekStartDate = new Date(weekStartKey)
                let c = 0
                for (let i = 0; i < 7; i++) {
                    const key = format(addDays(weekStartDate, i), 'yyyy-MM-dd')
                    const day = calendarMap.get(key)
                    if (day?.status === 'attended') c++
                }
                return c
            }

            const currentWeekKey = getWeekStartKey(new Date())
            let total = countAttendedInWeek(currentWeekKey)
            // Walk back through achieved weeks before current week
            const highlightIndex = mergedHighlights.findIndex(h => h.weekStart === currentWeekKey)
            let idx = highlightIndex === -1 ? mergedHighlights.findIndex(h => h.weekStart > currentWeekKey) - 1 : highlightIndex - 1
            if (isNaN(idx)) idx = mergedHighlights.length - 1
            for (let i = idx; i >= 0; i--) {
                const h = mergedHighlights[i]
                if (!h.achieved) break
                total += countAttendedInWeek(h.weekStart)
            }
            setStreakDays(total)
        } catch (error) {
            console.error('Failed to fetch calendar data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        if (isRestoring || !hasHydrated) {
            return
        }
        if (isAuthenticated && accessToken) {
            fetchCalendarData()
            fetchUserSettings()
        }
    }, [isAuthenticated, accessToken, hasHydrated, isRestoring, fetchCalendarData, fetchUserSettings])

    if (isRestoring) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading your schedule...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 text-muted-foreground">
                <p className="text-sm font-medium">Redirecting to login...</p>
            </div>
        )
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
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Check-in failed')
            }

            const description = (() => {
                if (!date) return 'Successfully checked in.'
                if (isToday(date)) return 'Successfully checked in for today.'
                if (isYesterday(date)) return 'Successfully checked in for yesterday.'
                return `Successfully checked in for ${format(date, 'MMM d, yyyy')}.`
            })()

            toast({
                title: 'Checked in!',
                description: data.suggestMakeup
                    ? 'This is an extra session. You can assign it as a make-up.'
                    : description,
            })

            // Refresh calendar for the month of the selected date
            await fetchCalendarData(date)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to check in',
                variant: 'destructive',
            })
        }
    }

    const handleDateSelect = (d: Date) => {
        setDate(d)
        // Fetch calendar data for the month being viewed/selected
        fetchCalendarData(d)
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
                            {null}
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
                                onDateSelect={handleDateSelect}
                                onCheckIn={handleCheckIn}
                                weeklyHighlights={weeklyHighlights}
                                suggestedWeekHighlights={suggestedWeekHighlights}
                                goldenDots={goldenDots}
                                streakDaysOverride={streakDays}
                                weeklyTargetDays={userSettings?.weeklyTargetDays}
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
