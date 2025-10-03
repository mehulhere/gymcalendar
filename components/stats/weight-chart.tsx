'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'

interface WeighIn {
    _id: string
    weight: number
    date: string
}

interface WeightChartProps {
    weighIns: WeighIn[]
    targetWeight?: number
}

export function WeightChart({ weighIns, targetWeight }: WeightChartProps) {
    const chartData = useMemo(() => {
        if (weighIns.length === 0) return null

        const sorted = [...weighIns].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        const weights = sorted.map(w => w.weight)
        const actualMinWeight = Math.min(...weights)
        const actualMaxWeight = Math.max(...weights)

        let minWeight = actualMinWeight
        let maxWeight = actualMaxWeight

        // Include target weight in range calculation if provided
        if (targetWeight) {
            minWeight = Math.min(minWeight, targetWeight)
            maxWeight = Math.max(maxWeight, targetWeight)
        }

        const range = maxWeight - minWeight || 1

        return {
            sorted,
            actualMinWeight,
            actualMaxWeight,
            minWeight: minWeight - 1,
            maxWeight: maxWeight + 1,
            range: range + 2,
        }
    }, [weighIns, targetWeight])

    if (!chartData || chartData.sorted.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No weight data yet. Start logging your weight to see trends.
            </div>
        )
    }

    const { sorted, actualMinWeight, actualMaxWeight, minWeight, maxWeight, range } = chartData
    const width = 600
    const height = 200
    const padding = { top: 20, right: 40, bottom: 40, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Calculate points
    const points = sorted.map((weighIn, index) => {
        const x = padding.left + (index / (sorted.length - 1 || 1)) * chartWidth
        const y = padding.top + chartHeight - ((weighIn.weight - minWeight) / range) * chartHeight
        return { x, y, weighIn }
    })

    // Create path
    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')

    // Create area path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`

    // Calculate target weight line position if provided
    const targetY = targetWeight
        ? padding.top + chartHeight - ((targetWeight - minWeight) / range) * chartHeight
        : null

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ minHeight: '200px' }}
            >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
                    const y = padding.top + chartHeight * (1 - percent)
                    const weight = (minWeight + range * percent).toFixed(1)
                    return (
                        <g key={percent}>
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
                                fontSize="12"
                                textAnchor="end"
                            >
                                {weight}
                            </text>
                        </g>
                    )
                })}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill="url(#weightGradient)"
                    opacity="0.2"
                />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Target weight line */}
                {targetY !== null && (
                    <>
                        <line
                            x1={padding.left}
                            y1={targetY}
                            x2={width - padding.right}
                            y2={targetY}
                            stroke="#a855f7"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            strokeOpacity="0.8"
                        />
                        <text
                            x={width - padding.right + 5}
                            y={targetY - 8}
                            fill="#a855f7"
                            fontSize="11"
                            fontWeight="600"
                        >
                            Target: {targetWeight} kg
                        </text>
                        <circle
                            cx={width - padding.right}
                            cy={targetY}
                            r="3"
                            fill="#a855f7"
                        />
                    </>
                )}

                {/* Points */}
                {points.map((point, index) => (
                    <g key={index}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#10b981"
                            stroke="white"
                            strokeWidth="2"
                        />
                        {/* Hover area */}
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="12"
                            fill="transparent"
                        >
                            <title>
                                {format(new Date(point.weighIn.date), 'MMM d, yyyy')}: {point.weighIn.weight} kg
                            </title>
                        </circle>
                    </g>
                ))}

                {/* X-axis labels */}
                {points.map((point, index) => {
                    // Only show labels for first, last, and middle points if many data points
                    const shouldShow =
                        sorted.length <= 5 ||
                        index === 0 ||
                        index === points.length - 1 ||
                        index === Math.floor(points.length / 2)

                    if (!shouldShow) return null

                    return (
                        <text
                            key={`label-${index}`}
                            x={point.x}
                            y={height - padding.bottom + 20}
                            fill="currentColor"
                            opacity="0.5"
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {format(new Date(point.weighIn.date), 'MMM d')}
                        </text>
                    )
                })}

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Stats below chart */}
            <div className="flex justify-around mt-4 text-xs text-muted-foreground">
                <div className="text-center">
                    <div className="font-medium text-foreground">{actualMinWeight.toFixed(1)} kg</div>
                    <div>Lowest</div>
                </div>
                <div className="text-center">
                    <div className="font-medium text-foreground">{actualMaxWeight.toFixed(1)} kg</div>
                    <div>Highest</div>
                </div>
                {targetWeight && (
                    <div className="text-center">
                        <div className="font-medium text-purple-500">{targetWeight.toFixed(1)} kg</div>
                        <div>Target</div>
                    </div>
                )}
                <div className="text-center">
                    <div className="font-medium text-foreground">
                        {(actualMaxWeight - actualMinWeight).toFixed(1)} kg
                    </div>
                    <div>Range</div>
                </div>
                <div className="text-center">
                    <div className="font-medium text-foreground">{sorted.length}</div>
                    <div>Entries</div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-emerald-500"></div>
                    <span className="text-muted-foreground">Current Weight</span>
                </div>
                {targetWeight && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-purple-500 border-dashed border-t-2 border-purple-500"></div>
                        <span className="text-muted-foreground">Target Weight</span>
                    </div>
                )}
            </div>
        </div>
    )
}

