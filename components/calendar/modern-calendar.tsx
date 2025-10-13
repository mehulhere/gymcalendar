'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, subMonths as subMonthsDate } from 'date-fns'
import { ActivityStats } from './activity-stats'

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

type WeeklyHighlight = { weekStart: string; achieved: boolean }

interface ModernCalendarProps {
    calendarData: CalendarDay[]
    selectedDate: Date | undefined
    onDateSelect: (date: Date) => void
    onCheckIn: () => void
    weeklyHighlights?: WeeklyHighlight[]
    suggestedWeekHighlights?: string[]
    goldenDots?: string[]
    streakDaysOverride?: number
    weeklyTargetDays?: number
}

export function ModernCalendar({ calendarData, selectedDate, onDateSelect, onCheckIn, weeklyHighlights = [], suggestedWeekHighlights = [], goldenDots = [], streakDaysOverride, weeklyTargetDays }: ModernCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    // Always show 6 weeks, with current week in the last row
    const today = new Date()
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 })

    // Calculate to show 5 weeks before current week + current week (6 total)
    const calendarStart = subMonths(todayWeekStart, 0)
    const weeksToShow = 6
    const daysToShow = weeksToShow * 7

    const tempStart = new Date(calendarStart)
    tempStart.setDate(tempStart.getDate() - (5 * 7)) // Go back 5 weeks

    const calendarDays = eachDayOfInterval({
        start: tempStart,
        end: new Date(tempStart.getTime() + (daysToShow - 1) * 24 * 60 * 60 * 1000)
    })

    const getDateStatus = (day: Date): CalendarDay | undefined => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return calendarData.find(d => d.date === dateStr)
    }

    const getDayStyle = (day: Date) => {
        const status = getDateStatus(day)
        const isCurrentMonth = isSameMonth(day, currentMonth)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)
        const isHovered = hoveredDate && isSameDay(day, hoveredDate)

        let baseClasses = 'relative aspect-square rounded-xl transition-all duration-300 cursor-pointer group'

        if (!isCurrentMonth) {
            return `${baseClasses} opacity-30 hover:opacity-50`
        }

        if (status?.status === 'attended') {
            return `${baseClasses} bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg hover:shadow-emerald-500/50 hover:scale-105`
        }

        if (status?.status === 'missed') {
            return `${baseClasses} bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg hover:shadow-red-500/50 hover:scale-105`
        }

        if (isTodayDate) {
            return `${baseClasses} bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 shadow-lg hover:shadow-purple-500/50 hover:scale-105 ring-2 ring-purple-400 ring-offset-2 ring-offset-background`
        }

        if (isSelected) {
            return `${baseClasses} bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-blue-500/50 hover:scale-105`
        }

        return `${baseClasses} bg-muted/50 hover:bg-muted hover:scale-105 hover:shadow-md`
    }

    const currentMonthStats = calendarData.filter(d => {
        const dayDate = new Date(d.date)
        return isSameMonth(dayDate, currentMonth)
    })

    const attendedCount = currentMonthStats.filter(d => d.status === 'attended').length
    const missedCount = currentMonthStats.filter(d => d.status === 'missed').length
    const streak = typeof streakDaysOverride === 'number' ? streakDaysOverride : calculateStreak()

    function calculateStreak(): number {
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

        return streak
    }

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span>{attendedCount} days</span>
                        </div>
                        {streak > 0 && (
                            <>
                                <div className="flex items-center gap-1 text-orange-500">
                                    <Flame className="h-4 w-4 shrink-0" />
                                    <span className="font-semibold">{streak} day streak</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Weeks */}
                <div className="space-y-2">
                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                        const weekStart = weekIndex * 7
                        const weekDays = calendarDays.slice(weekStart, weekStart + 7)
                        // Use Monday as week key to match API grouping
                        const mondayOfRow = weekDays[0]
                        const weekStartKey = format(mondayOfRow, 'yyyy-MM-dd')
                        const weekAchieved = weeklyHighlights.find(w => w.weekStart === weekStartKey)?.achieved
                        const suggestHighlight = suggestedWeekHighlights.includes(weekStartKey)
                        // Determine the first and last column indexes that belong to currentMonth
                        const firstInMonthIdx = weekDays.findIndex(d => isSameMonth(d, currentMonth))
                        let lastInMonthIdx = -1
                        for (let i = 6; i >= 0; i--) {
                            if (isSameMonth(weekDays[i], currentMonth)) { lastInMonthIdx = i; break }
                        }

                        return (
                            <div key={weekIndex} className="relative">
                                {/* Full Week Highlight Background limited to current month days */}
                                {(weekAchieved || suggestHighlight) && firstInMonthIdx !== -1 && lastInMonthIdx !== -1 && (
                                    <div className="absolute inset-x-[-8px] -top-1 -bottom-1 pointer-events-none -z-10">
                                        <div className="grid grid-cols-7 h-full">
                                            <div
                                                style={{ gridColumn: `${firstInMonthIdx + 1} / ${lastInMonthIdx + 2}` }}
                                                className={`h-full rounded-xl border ${suggestHighlight
                                                    ? 'bg-gradient-to-r from-emerald-500/30 via-emerald-500/40 to-emerald-500/30 border-emerald-500/40'
                                                    : 'bg-gradient-to-r from-emerald-500/30 via-emerald-500/40 to-emerald-500/30 dark:from-emerald-500/35 dark:via-emerald-500/45 dark:to-emerald-500/35 border-emerald-500/40 dark:border-emerald-400/40'}`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Week Row */}
                                <div className="relative grid grid-cols-7 gap-2">
                                    {weekDays.map((day, dayIndex) => {
                                        const status = getDateStatus(day)
                                        const dayNumber = format(day, 'd')
                                        const isCurrentMonth = isSameMonth(day, currentMonth)
                                        const index = weekStart + dayIndex
                                        const dateKey = format(day, 'yyyy-MM-dd')
                                        const isGolden = goldenDots.includes(dateKey)

                                        return (
                                            <div
                                                key={index}
                                                className={`relative ${getDayStyle(day)}`}
                                                onClick={() => onDateSelect(day)}
                                                onMouseEnter={() => setHoveredDate(day)}
                                                onMouseLeave={() => setHoveredDate(null)}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`
                                        text-sm font-semibold transition-all
                                        ${status?.status === 'attended' || status?.status === 'missed' || isToday(day)
                                                            ? 'text-white'
                                                            : isCurrentMonth
                                                                ? 'text-foreground'
                                                                : 'text-muted-foreground'
                                                        }
                                      `}>
                                                        {dayNumber}
                                                    </span>
                                                </div>

                                                {/* Indicator Dots (only one per day) */}
                                                {isGolden ? (
                                                    <div className="absolute top-1 left-1">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"></div>
                                                    </div>
                                                ) : (
                                                    status?.hasDoubleSession && (
                                                        <div className="absolute top-1 right-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-lg"></div>
                                                        </div>
                                                    )
                                                )}

                                                {/* Hover Tooltip */}
                                                {hoveredDate && isSameDay(day, hoveredDate) && isCurrentMonth && (
                                                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-black text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl">
                                                        {format(day, 'MMM d, yyyy')}
                                                        {status && (
                                                            <div className="font-semibold capitalize mt-0.5">
                                                                {status.status}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Check In Button */}
            <button
                onClick={onCheckIn}
                disabled={!selectedDate}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
                <div className="flex items-center justify-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedDate ? (
                        <span>Check In for {format(selectedDate, 'MMM d')}</span>
                    ) : (
                        <span>Select a date to check in</span>
                    )}
                </div>
            </button>

            {/* Activity Stats */}
            <ActivityStats calendarData={calendarData} timeRange={30} streakOverride={streak} weeklyTargetDays={weeklyTargetDays} />
        </div>
    )
}
