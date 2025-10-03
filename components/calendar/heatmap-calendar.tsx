'use client'

import { useState, useMemo } from 'react'
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { ActivityStats } from './activity-stats'

interface CalendarDay {
    date: string
    isScheduled: boolean
    status: 'attended' | 'missed' | 'rest' | 'scheduled'
    sessionCount: number
    hasDoubleSession: boolean
}

interface HeatmapCalendarProps {
    calendarData: CalendarDay[]
    selectedDate: Date | undefined
    onDateSelect: (date: Date) => void
    onCheckIn: () => void
}

type TimeRange = '30' | '90' | '365'

export function HeatmapCalendar({ calendarData, selectedDate, onDateSelect, onCheckIn }: HeatmapCalendarProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('30')
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

    const days = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const range = parseInt(timeRange)

        // Show exactly 'range' days, ending with today
        const startDate = subDays(today, range - 1)
        return eachDayOfInterval({ start: startDate, end: today })
    }, [timeRange])

    const getDateStatus = (day: Date): CalendarDay | undefined => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return calendarData.find(d => d.date === dateStr)
    }

    const getIntensityColor = (day: Date) => {
        const status = getDateStatus(day)

        if (!status) return 'bg-muted/30'

        switch (status.status) {
            case 'attended':
                if (status.hasDoubleSession) return 'bg-emerald-600'
                return 'bg-emerald-500'
            case 'missed':
                return 'bg-red-500'
            default:
                return 'bg-muted/30'
        }
    }


    // Calculate grid dimensions for square layout
    const gridDimensions = useMemo(() => {
        const totalDays = days.length
        const cols = Math.ceil(Math.sqrt(totalDays))
        const rows = Math.ceil(totalDays / cols)
        const totalCells = cols * rows
        const paddingCells = totalCells - totalDays

        return { cols, rows, totalDays, totalCells, paddingCells }
    }, [days])

    const cellSize = timeRange === '365' ? 'w-3 h-3' : timeRange === '90' ? 'w-6 h-6' : 'w-8 h-8'

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header with Time Range Selector */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Heatmap View</h2>
                    <p className="text-sm text-muted-foreground">
                        {format(days[0], 'MMM d, yyyy')} - {format(days[days.length - 1], 'MMM d, yyyy')}
                    </p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    {(['30', '90', '365'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${timeRange === range
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
              `}
                        >
                            {range === '30' ? '30 Days' : range === '90' ? '90 Days' : '1 Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Heatmap Grid - Square Layout */}
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                        {gridDimensions.totalDays} days
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-muted/30"></div>
                            <div className="w-3 h-3 rounded-sm bg-emerald-300/50"></div>
                            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                            <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                        </div>
                        <span className="text-xs text-muted-foreground">More</span>
                    </div>
                </div>

                {/* Square Grid */}
                <div className="flex justify-center">
                    <div
                        className="grid gap-1.5 w-fit mx-auto"
                        style={{
                            gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(0, 1fr))`,
                        }}
                    >
                        {/* Empty cells for padding at the start */}
                        {Array.from({ length: gridDimensions.paddingCells }).map((_, index) => (
                            <div key={`empty-${index}`} className={`${cellSize} opacity-0`}></div>
                        ))}

                        {/* Actual days */}
                        {days.map((day, index) => {
                            const status = getDateStatus(day)
                            const isSelected = selectedDate && isSameDay(day, selectedDate)
                            const isHovered = hoveredDate && isSameDay(day, hoveredDate)

                            return (
                                <div
                                    key={index}
                                    className={`
                    ${cellSize} rounded-lg transition-all cursor-pointer relative
                    ${getIntensityColor(day)}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background scale-110' : ''}
                    hover:ring-2 hover:ring-foreground/30 hover:scale-125 hover:z-10 hover:shadow-lg
                  `}
                                    onClick={() => onDateSelect(day)}
                                    onMouseEnter={() => setHoveredDate(day)}
                                    onMouseLeave={() => setHoveredDate(null)}
                                >
                                    {/* Tooltip */}
                                    {isHovered && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl">
                                            <div className="font-semibold">{format(day, 'MMM d, yyyy')}</div>
                                            {status ? (
                                                <div className="mt-1 capitalize text-emerald-300">{status.status}</div>
                                            ) : (
                                                <div className="mt-1 text-gray-400">No activity</div>
                                            )}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-black rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
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
            <ActivityStats calendarData={calendarData} timeRange={parseInt(timeRange)} />
        </div>
    )
}
