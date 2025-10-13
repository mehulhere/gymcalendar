'use client'

import { useMemo } from 'react'
import { Flame, TrendingUp, Calendar as CalendarIcon, Zap } from 'lucide-react'
import { differenceInDays, subDays, startOfWeek, addDays } from 'date-fns'

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

interface ActivityStatsProps {
    calendarData: CalendarDay[]
    timeRange?: number // days to look back
    streakOverride?: number
    weeklyTargetDays?: number
}

export function ActivityStats({ calendarData, timeRange = 30, streakOverride, weeklyTargetDays }: ActivityStatsProps) {
    const stats = useMemo(() => {
        const now = new Date()
        const rangeStart = subDays(now, timeRange - 1)

        // Determine effective start as the later of rangeStart and the first attended date
        const earliestAttended = (() => {
            const attendedDates = calendarData
                .filter(d => d.status === 'attended')
                .map(d => new Date(d.date))
                .sort((a, b) => a.getTime() - b.getTime())
            return attendedDates.length > 0 ? attendedDates[0] : null
        })()

        const effectiveStart = earliestAttended ? (earliestAttended > rangeStart ? earliestAttended : rangeStart) : null

        const inEffectiveWindow = (d: CalendarDay) => {
            const dayDate = new Date(d.date)
            if (!effectiveStart) return false
            return dayDate >= effectiveStart && dayDate <= now
        }

        const rangeData = effectiveStart
            ? calendarData.filter(inEffectiveWindow)
            : []

        const attendedTotal = rangeData.filter(d => d.status === 'attended').length
        const scheduledAttended = rangeData.filter(d => d.isScheduled && d.status === 'attended').length
        const scheduledMissed = rangeData.filter(d => d.isScheduled && d.status === 'missed').length

        let expected: number
        let completed: number
        let missed: number

        if (weeklyTargetDays && weeklyTargetDays > 0) {
            if (effectiveStart) {
                // Compute per-week expected/completed to prevent carry-over across weeks
                const weekStart = startOfWeek(effectiveStart, { weekStartsOn: 1 })
                const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })

                let cursor = new Date(weekStart)
                let expSum = 0
                let compSum = 0

                const attendedDatesSet = new Set(
                    rangeData.filter(d => d.status === 'attended').map(d => d.date)
                )

                while (cursor <= thisWeekStart) {
                    const wkStart = new Date(cursor)
                    const wkEnd = addDays(wkStart, 6)
                    const overlapStart = effectiveStart > wkStart ? effectiveStart : wkStart
                    const overlapEnd = now < wkEnd ? now : wkEnd
                    const daysInOverlap = overlapEnd >= overlapStart ? (differenceInDays(overlapEnd, overlapStart) + 1) : 0

                    const expectedWeek = Math.max(Math.round((daysInOverlap * weeklyTargetDays) / 7), 0)

                    let attendedWeek = 0
                    if (daysInOverlap > 0) {
                        for (let i = 0; i < 7; i++) {
                            const d = addDays(wkStart, i)
                            if (d < overlapStart || d > overlapEnd) continue
                            const key = d.toISOString().slice(0, 10)
                            if (attendedDatesSet.has(key)) attendedWeek++
                        }
                    }

                    expSum += expectedWeek
                    compSum += Math.min(attendedWeek, expectedWeek)

                    cursor = addDays(cursor, 7)
                }

                expected = expSum
                completed = compSum
            } else {
                expected = 0
                completed = 0
            }
            missed = Math.max(expected - completed, 0)
        } else {
            expected = scheduledAttended + scheduledMissed
            completed = scheduledAttended
            missed = Math.max(expected - scheduledAttended, 0)
        }

        const percentage = expected > 0 ? Math.min(100, (completed / expected) * 100) : 0

        // Debug: print missed day calculation
        try {
            // eslint-disable-next-line no-console
            console.log('[ActivityStats] Missed calc', {
                weeklyTargetDays,
                effectiveStart: effectiveStart ? effectiveStart.toISOString().slice(0, 19) : null,
                now: now.toISOString().slice(0, 19),
                daysCovered: effectiveStart ? (differenceInDays(now, effectiveStart) + 1) : null,
                attendedTotal,
                unscheduledAttended: rangeData.filter(d => !d.isScheduled && d.status === 'attended').length,
                scheduledAttended,
                scheduledMissed,
                expected,
                completed,
                missed,
                percentage: Number.isFinite(percentage) ? Number(percentage.toFixed(2)) : 0,
            })
        } catch { }

        // Calculate current streak (overridden if provided)
        let computedStreak: number
        if (typeof streakOverride === 'number') {
            computedStreak = streakOverride
        } else {
            const sorted = [...calendarData]
                .filter(d => d.status === 'attended')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            let streak = 0
            let currentDate = new Date()

            for (const day of sorted) {
                const dayDate = new Date(day.date)
                const diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24))

                if (diffDays <= streak + 1) {
                    streak++
                    currentDate = dayDate
                } else {
                    break
                }
            }
            computedStreak = streak
        }

        // Display: Workouts = actual attended; Missed = expected - attended (or scheduledMissed fallback)
        return { attended: attendedTotal, missed, total: expected, percentage, streak: computedStreak }
    }, [calendarData, timeRange, streakOverride, weeklyTargetDays])

    const getInsightMessage = () => {
        if (stats.attended === 0) return null

        if (stats.percentage >= 80) {
            return "🔥 Outstanding! You're crushing it with " + stats.percentage.toFixed(0) + "% consistency!"
        }
        if (stats.percentage >= 60) {
            return "✨ Great work! Keep up the " + stats.percentage.toFixed(0) + "% consistency rate!"
        }
        if (stats.streak >= 7) {
            return "🎯 Amazing " + stats.streak + "-day streak! You're on fire!"
        }
        if (stats.streak >= 3) {
            return "⚡ Nice " + stats.streak + "-day streak going!"
        }
        return "💪 You're building the habit. Keep it up!"
    }

    const insightMessage = getInsightMessage()

    return (
        <div className="space-y-3 md:space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                        <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Workouts</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.attended}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Last {timeRange} days</div>
                </div>

                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <Flame className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Streak</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.streak}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Days in a row</div>
                </div>
                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Rate</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.percentage.toFixed(0)}%</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Success rate</div>
                </div>


                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-red-600 dark:text-red-400 mb-1">
                        <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Missed</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.missed}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Skipped days</div>
                </div>
            </div>

        </div>
    )
}
