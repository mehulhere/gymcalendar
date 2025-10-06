'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'

interface PeakVolumeEntry {
    date: string
    peakVolume: number
}

interface PeakVolumeChartProps {
    data: PeakVolumeEntry[]
}

export function PeakVolumeChart({ data }: PeakVolumeChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null

        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        const volumes = sorted.map(entry => entry.peakVolume)
        const maxVolume = Math.max(...volumes)
        const totalVolume = volumes.reduce((sum, volume) => sum + volume, 0)
        const averageVolume = totalVolume / sorted.length
        const maxEntryIndex = volumes.indexOf(maxVolume)
        const maxEntry = maxEntryIndex >= 0 ? sorted[maxEntryIndex] : null

        const maxAxisVolume = maxVolume === 0 ? 10 : maxVolume * 1.1

        return {
            sorted,
            maxVolume,
            totalVolume,
            averageVolume,
            maxEntry,
            maxAxisVolume,
        }
    }, [data])

    if (!chartData) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No volume history yet. Log this exercise to see trends.
            </div>
        )
    }

    const { sorted, maxVolume, averageVolume, maxEntry, maxAxisVolume } = chartData
    const width = 640
    const height = 240
    const padding = { top: 20, right: 40, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const points = sorted.map((entry, index) => {
        const x = padding.left + (index / (sorted.length - 1 || 1)) * chartWidth
        const y = padding.top + chartHeight - ((entry.peakVolume / maxAxisVolume) * chartHeight)
        return { x, y, entry }
    })

    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`

    const yTickCount = 4

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ minHeight: '240px' }}
            >
                {[...Array(yTickCount + 1)].map((_, index) => {
                    const ratio = index / yTickCount
                    const y = padding.top + chartHeight * (1 - ratio)
                    const volume = (maxAxisVolume * ratio).toFixed(0)
                    return (
                        <g key={index}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.1"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={y + 4}
                                fill="currentColor"
                                opacity="0.5"
                                fontSize="11"
                                textAnchor="end"
                            >
                                {volume}
                            </text>
                        </g>
                    )
                })}

                <path d={areaPath} fill="url(#volumeGradient)" opacity="0.2" />

                <path
                    d={linePath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {points.map((point, index) => (
                    <g key={index}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#6366f1"
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle cx={point.x} cy={point.y} r="12" fill="transparent">
                            <title>
                                {format(new Date(point.entry.date), 'MMM d, yyyy')}: {point.entry.peakVolume} kg volume
                            </title>
                        </circle>
                    </g>
                ))}

                {points.map((point, index) => {
                    const shouldShowLabel =
                        sorted.length <= 6 ||
                        index === 0 ||
                        index === points.length - 1 ||
                        index === Math.floor(points.length / 2)

                    if (!shouldShowLabel) return null

                    return (
                        <text
                            key={`label-${index}`}
                            x={point.x}
                            y={height - padding.bottom + 18}
                            fill="currentColor"
                            opacity="0.5"
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {format(new Date(point.entry.date), 'MMM d')}
                        </text>
                    )
                })}

                <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex flex-wrap items-center justify-around gap-4 mt-4 text-xs text-muted-foreground">
                <div className="text-center">
                    <div className="font-medium text-foreground">{maxVolume.toFixed(0)} kg</div>
                    <div>Peak Set Volume</div>
                </div>
                <div className="text-center">
                    <div className="font-medium text-foreground">{averageVolume.toFixed(0)} kg</div>
                    <div>Average Peak</div>
                </div>
                <div className="text-center">
                    <div className="font-medium text-foreground">{sorted.length}</div>
                    <div>Training Days</div>
                </div>
                {maxEntry && (
                    <div className="text-center">
                        <div className="font-medium text-foreground">
                            {format(new Date(maxEntry.date), 'MMM d, yyyy')}
                        </div>
                        <div>Highest Volume Day</div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-indigo-500"></div>
                    <span className="text-muted-foreground">Peak set volume</span>
                </div>
            </div>
        </div>
    )
}

