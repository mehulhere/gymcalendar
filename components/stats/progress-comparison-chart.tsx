'use client'

import { useMemo } from 'react'

interface SeriesConfig {
    label: string
    data: number[]
    color: string
}

interface ProgressComparisonChartProps {
    labels: string[]
    volumeSeries: SeriesConfig[]
    weightSeries?: SeriesConfig | null
    volumeLabel?: string
    weightLabel?: string
}

export function ProgressComparisonChart({
    labels,
    volumeSeries,
    weightSeries,
    volumeLabel = 'Volume (kg)',
    weightLabel = 'Weight (kg)',
}: ProgressComparisonChartProps) {
    const chartData = useMemo(() => {
        if (labels.length === 0 || volumeSeries.length === 0) {
            return null
        }

        const maxVolume = Math.max(
            1,
            ...volumeSeries.map(series => Math.max(...series.data, 0))
        )

        const maxWeight = weightSeries ? Math.max(1, ...weightSeries.data) : 1
        const weightAvailable = !!weightSeries && weightSeries.data.some(value => value > 0)

        const width = Math.max(640, labels.length * 80)
        const height = 280
        const padding = {
            top: 24,
            right: weightAvailable ? 70 : 40,
            bottom: 48,
            left: 60,
        }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom

        const getX = (index: number) => {
            if (labels.length === 1) return padding.left + chartWidth / 2
            return padding.left + (index / (labels.length - 1)) * chartWidth
        }

        const volumePaths = volumeSeries.map(series => {
            const points = series.data.map((value, index) => {
                const x = getX(index)
                const ratio = maxVolume === 0 ? 0 : value / maxVolume
                const y = padding.top + chartHeight - ratio * chartHeight
                return { x, y }
            })

            const path = points
                .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                .join(' ')

            return { series, points, path }
        })

        let weightPoints: { x: number; y: number }[] | null = null
        let weightPath: string | null = null

        if (weightAvailable && weightSeries) {
            weightPoints = weightSeries.data.map((value, index) => {
                const x = getX(index)
                const ratio = maxWeight === 0 ? 0 : value / maxWeight
                const y = padding.top + chartHeight - ratio * chartHeight
                return { x, y }
            })

            weightPath = weightPoints
                .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                .join(' ')
        }

        return {
            width,
            height,
            padding,
            chartWidth,
            chartHeight,
            maxVolume,
            maxWeight,
            volumePaths,
            weightAvailable,
            weightPoints,
            weightPath,
        }
    }, [labels.length, volumeSeries, weightSeries])

    if (!chartData) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No data yet. Complete more sessions to unlock insights.
            </div>
        )
    }

    const {
        width,
        height,
        padding,
        chartWidth,
        chartHeight,
        maxVolume,
        maxWeight,
        volumePaths,
        weightAvailable,
        weightPoints,
        weightPath,
    } = chartData

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ minHeight: `${height}px` }}
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = padding.top + chartHeight * (1 - ratio)
                    const volumeTick = Math.round(maxVolume * ratio)
                    const weightTick = Math.round(maxWeight * ratio * 10) / 10
                    return (
                        <g key={`grid-${index}`}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.08"
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
                                {volumeTick}
                            </text>
                            {weightAvailable && (
                                <text
                                    x={width - padding.right + 10}
                                    y={y + 4}
                                    fill="currentColor"
                                    opacity="0.5"
                                    fontSize="11"
                                >
                                    {weightTick}
                                </text>
                            )}
                        </g>
                    )
                })}

                {/* Volume series paths */}
                {volumePaths.map(({ series, path }, index) => (
                    <path
                        key={`line-${series.label}-${index}`}
                        d={path}
                        fill="none"
                        stroke={series.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                    />
                ))}

                {/* Weight path */}
                {weightAvailable && weightPath && weightSeries && (
                    <path
                        d={weightPath}
                        fill="none"
                        stroke={weightSeries.color}
                        strokeWidth="2"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                    />
                )}

                {/* Points */}
                {volumePaths.map(({ series, points }, seriesIndex) => (
                    <g key={`points-${series.label}-${seriesIndex}`}>
                        {points.map((point, index) => (
                            <g key={index}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    fill={series.color}
                                    stroke="white"
                                    strokeWidth="2"
                                />
                                <circle cx={point.x} cy={point.y} r="12" fill="transparent">
                                    <title>
                                        {labels[index]} • {series.label}: {series.data[index].toFixed(0)} kg
                                    </title>
                                </circle>
                            </g>
                        ))}
                    </g>
                ))}

                {/* Weight points */}
                {weightAvailable && weightPoints && weightSeries && (
                    <g>
                        {weightPoints.map((point, index) => (
                            <g key={`weight-${index}`}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="3.5"
                                    fill={weightSeries.color}
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                                <circle cx={point.x} cy={point.y} r="12" fill="transparent">
                                    <title>
                                        {labels[index]} • {weightSeries.label}: {weightSeries.data[index].toFixed(1)} kg
                                    </title>
                                </circle>
                            </g>
                        ))}
                    </g>
                )}

                {/* X-axis labels */}
                {labels.map((label, index) => (
                    <text
                        key={`label-${index}`}
                        x={padding.left + (labels.length === 1 ? chartWidth / 2 : (index / (labels.length - 1)) * chartWidth)}
                        y={height - padding.bottom + 24}
                        fill="currentColor"
                        opacity="0.6"
                        fontSize="11"
                        textAnchor="middle"
                    >
                        {label}
                    </text>
                ))}

                {/* Axis titles */}
                <text
                    x={padding.left}
                    y={padding.top - 8}
                    fill="currentColor"
                    opacity="0.7"
                    fontSize="12"
                    textAnchor="start"
                >
                    {volumeLabel}
                </text>

                {weightAvailable && (
                    <text
                        x={width - padding.right}
                        y={padding.top - 8}
                        fill="currentColor"
                        opacity="0.7"
                        fontSize="12"
                        textAnchor="end"
                    >
                        {weightLabel}
                    </text>
                )}
            </svg>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                {volumeSeries.map(series => (
                    <div key={`legend-${series.label}`} className="flex items-center gap-2">
                        <span className="w-6 h-0.5" style={{ backgroundColor: series.color }} />
                        <span className="font-medium text-foreground">{series.label}</span>
                    </div>
                ))}
                {weightAvailable && weightSeries && (
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 border-b-2 border-dashed" style={{ borderColor: weightSeries.color }} />
                        <span className="font-medium text-foreground">{weightSeries.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
