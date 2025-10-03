'use client'

import { useMemo } from 'react'
import { Flame, TrendingUp, Calendar as CalendarIcon, Zap } from 'lucide-react'
import { differenceInDays } from 'date-fns'

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
}

export function ActivityStats({ calendarData, timeRange = 30 }: ActivityStatsProps) {
    const stats = useMemo(() => {
        const rangeData = calendarData.filter(d => {
            const dayDate = new Date(d.date)
            const now = new Date()
            const diff = differenceInDays(now, dayDate)
            return diff <= timeRange && diff >= 0
        })

        const attended = rangeData.filter(d => d.status === 'attended').length
        const missed = rangeData.filter(d => d.status === 'missed').length
        const total = attended + missed
        const percentage = total > 0 ? (attended / total) * 100 : 0

        // Calculate current streak
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

        return { attended, missed, total, percentage, streak }
    }, [calendarData, timeRange])

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

                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Rate</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.percentage.toFixed(0)}%</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Success rate</div>
                </div>

                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-1.5 md:gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <Flame className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">Streak</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{stats.streak}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Days in a row</div>
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
