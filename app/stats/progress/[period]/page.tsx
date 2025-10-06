'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ProgressComparisonChart } from '@/components/stats/progress-comparison-chart'
import { Loader2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import type { ProgressDetailResponse, ProgressRecordEntry, ProgressWorstEntry } from '@/lib/stats/progress'
import { format } from 'date-fns'
import { formatSetDisplay } from '@/lib/stats/progress'

const bestLabels: Record<ProgressRecordEntry['category'], string> = {
    PB: 'Personal Best',
    BEST_1Y: '1 Year Best',
    BEST_3M: '3 Month Best',
    BEST_1M: '1 Month Best',
}

const worstLabels: Record<ProgressWorstEntry['category'], string> = {
    PW: 'Personal Worst',
    WORST_1Y: '1 Year Low',
    WORST_3M: '3 Month Low',
    WORST_1M: '1 Month Low',
}

const volumeColors = ['#10b981', '#6366f1']
const weightColor = '#f97316'

export default function ProgressDetailPage() {
    const params = useParams<{ period: string }>()
    const router = useRouter()
    const { accessToken } = useAuthStore()

    const period = Array.isArray(params?.period) ? params.period[0] : params?.period
    const [data, setData] = useState<ProgressDetailResponse | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!period || (period !== 'weekly' && period !== 'monthly') || !accessToken) {
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/stats/progress/${period}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                })

                if (response.ok) {
                    const payload = await response.json()
                    setData(payload)
                } else {
                    const message = await response.json().catch(() => null)
                    setError(message?.error || 'Unable to load progress stats')
                }
            } catch (err) {
                console.error('Failed to load progress stats', err)
                setError('Unable to load progress stats')
            } finally {
                setIsLoading(false)
            }
        }

        load()
    }, [accessToken, period])

    const title = period === 'weekly' ? 'Weekly Progress' : 'Monthly Progress'
    const subtitle = period === 'weekly'
        ? 'Comparing this week to the previous week'
        : 'Comparing this month to the previous month'

    const trend = useMemo(() => {
        if (!data) return null
        if (data.percentChange > 0) {
            return {
                label: 'Increase vs previous',
                className: 'text-emerald-500',
                badge: 'bg-emerald-500/10 text-emerald-500',
                icon: TrendingUp,
            }
        }
        if (data.percentChange < 0) {
            return {
                label: 'Decrease vs previous',
                className: 'text-red-500',
                badge: 'bg-red-500/10 text-red-500',
                icon: TrendingDown,
            }
        }
        return {
            label: 'No change',
            className: 'text-muted-foreground',
            badge: 'bg-muted text-muted-foreground',
            icon: TrendingUp,
        }
    }, [data])

    const percentText = useMemo(() => {
        if (!data) return '0%'
        const value = data.percentChange
        const absValue = Math.abs(value)
        const formatted = absValue >= 10 ? absValue.toFixed(0) : absValue.toFixed(1)
        const sign = value > 0 ? '+' : value < 0 ? '-' : ''
        return `${sign}${formatted}%`
    }, [data])

    const comparisonSeries = useMemo(() => {
        if (!data) return null
        const baseSeries = [
            {
                label: period === 'weekly' ? 'Current Week' : 'Current Month',
                data: data.comparison.currentSeries,
                color: volumeColors[0],
            },
            {
                label: period === 'weekly' ? 'Previous Week' : 'Previous Month',
                data: data.comparison.previousSeries,
                color: volumeColors[1],
            },
        ]

        const weightSeries = data.comparison.weightSeries && data.comparison.weightSeries.some(value => value > 0)
            ? {
                label: 'Body Weight',
                data: data.comparison.weightSeries,
                color: weightColor,
            }
            : null

        return {
            labels: data.comparison.labels,
            volumeSeries: baseSeries,
            weightSeries,
        }
    }, [data, period])

    const renderRecordItem = (record: ProgressRecordEntry, index: number) => {
        const label = bestLabels[record.category]
        return (
            <li key={`${record.exerciseId}-${index}`} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{record.exerciseName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {label} • {format(new Date(record.date), 'MMM d, yyyy')}
                    </p>
                </div>
                <span className="text-sm font-semibold text-emerald-500 whitespace-nowrap">
                    {formatSetDisplay(record.reps, record.weight)}
                </span>
            </li>
        )
    }

    const renderWorstItem = (record: ProgressWorstEntry, index: number) => {
        const label = worstLabels[record.category]
        return (
            <li key={`${record.exerciseId}-${index}`} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{record.exerciseName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {label} • {format(new Date(record.date), 'MMM d, yyyy')}
                    </p>
                </div>
                <span className="text-sm font-semibold text-red-500 whitespace-nowrap">
                    {formatSetDisplay(record.reps, record.weight)}
                </span>
            </li>
        )
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full border border-transparent hover:border-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl md:text-4xl font-black">
                        <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                            {title}
                        </span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
                </div>

                {isLoading ? (
                    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                        <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Crunching the numbers...
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                        <CardContent className="py-12 text-center space-y-4">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button size="sm" onClick={() => router.refresh()}>Try again</Button>
                        </CardContent>
                    </Card>
                ) : data ? (
                    <>
                        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Volume Change</CardTitle>
                                <CardDescription>How your training load shifted</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className={`text-4xl font-black ${trend ? trend.className : 'text-foreground'}`}>{percentText}</div>
                                        {trend && (
                                            <span className={`inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full ${trend.badge}`}>
                                                <trend.icon className="h-4 w-4" />
                                                {trend.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground text-right">
                                        <div>Current: {data.currentVolume.toFixed(0)} kg</div>
                                        <div>Previous: {data.previousVolume.toFixed(0)} kg</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Volume vs Previous Period</CardTitle>
                                <CardDescription>Overlayed comparison with body weight</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {comparisonSeries ? (
                                    <ProgressComparisonChart
                                        labels={comparisonSeries.labels}
                                        volumeSeries={comparisonSeries.volumeSeries}
                                        weightSeries={comparisonSeries.weightSeries}
                                    />
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                                        Not enough data yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Top Breakthroughs</CardTitle>
                                    <CardDescription>Records you set this {period === 'weekly' ? 'week' : 'month'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.bestRecords.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {data.bestRecords.map(renderRecordItem)}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No new bests yet. Keep pushing!</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Tough Sets</CardTitle>
                                    <CardDescription>Lowest volume efforts logged this {period === 'weekly' ? 'week' : 'month'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.worstRecords.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {data.worstRecords.map(renderWorstItem)}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No low-volume sets recorded.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : null}
            </div>

            <BottomNav />
        </div>
    )
}
