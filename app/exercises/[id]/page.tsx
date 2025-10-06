'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PeakVolumeChart } from '@/components/stats/peak-volume-chart'
import { getYouTubeLinks } from '@/lib/youtube'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Loader2, ArrowLeft, Youtube, Trophy, CalendarDays, Dumbbell, ChevronRight } from 'lucide-react'
import type { ExerciseDetailStats } from '@/lib/stats/exercise-performance'
import { formatSetDisplay } from '@/lib/stats/progress'

interface ExerciseDetail {
    _id: string
    name: string
    equipment?: string
    primary_muscles: string[]
    secondary_muscles: string[]
    category?: string
    youtube_query_override?: string
}

interface AlternativeExercise {
    _id: string
    name: string
    equipment?: string
    primary_muscles: string[]
    secondary_muscles: string[]
    category?: string
    youtube_query_override?: string
}

interface ExerciseDetailResponse {
    exercise: ExerciseDetail
    stats: ExerciseDetailStats
    alternatives: AlternativeExercise[]
    youtubeQuery: string
}

export default function ExerciseDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { accessToken } = useAuthStore()

    const exerciseId = Array.isArray(params?.id) ? params?.id[0] : params?.id

    const [data, setData] = useState<ExerciseDetailResponse | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const loadExercise = useCallback(async (id: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/stats/exercises/${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const payload = await response.json()
                setData(payload)
            } else {
                const message = await response.json().catch(() => null)
                setError(message?.error || 'Unable to load exercise stats')
            }
        } catch (err) {
            console.error('Failed to load exercise stats', err)
            setError('Unable to load exercise stats')
        } finally {
            setIsLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        if (!exerciseId || !accessToken) return
        loadExercise(exerciseId)
    }, [exerciseId, accessToken, loadExercise])

    const bestCards = useMemo(() => {
        if (!data) return []
        const entries: Array<{ key: string; title: string; record: ExerciseDetailStats['personalBest']; accent: string }> = [
            { key: 'pb', title: 'Personal Best', record: data.stats.personalBest, accent: 'from-emerald-500 to-emerald-600' },
            { key: 'best1M', title: '1 Month Best', record: data.stats.best1M, accent: 'from-sky-500 to-sky-600' },
            { key: 'best3M', title: '3 Month Best', record: data.stats.best3M, accent: 'from-violet-500 to-violet-600' },
        ]

        if (data.stats.best1Y) {
            entries.push({ key: 'best1Y', title: '1 Year Best', record: data.stats.best1Y, accent: 'from-amber-500 to-amber-600' })
        }

        return entries
    }, [data])

    const formatBestRecord = (record: ExerciseDetailStats['personalBest']) => {
        if (!record) return null
        return {
            display: formatSetDisplay(record.reps, record.weight),
            volume: record.volume,
            reps: record.reps,
            weight: record.weight,
            date: format(new Date(record.date), 'MMM d, yyyy'),
        }
    }

    const handleOpenYouTube = useCallback(() => {
        if (!data) return
        const links = getYouTubeLinks(data.youtubeQuery)
        const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
        const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

        if (isAndroid) {
            window.location.href = links.android
            setTimeout(() => {
                window.location.href = links.mobile
            }, 300)
        } else if (isIOS) {
            window.location.href = links.ios
            setTimeout(() => {
                window.location.href = links.mobile
            }, 300)
        } else {
            window.open(links.web, '_blank', 'noopener')
        }
    }, [data])

    const summaryItems = useMemo(() => {
        if (!data) return []
        return [
            {
                title: 'Total Sessions',
                value: data.stats.totalSessions,
                icon: CalendarDays,
            },
            {
                title: 'Total Sets',
                value: data.stats.totalSets,
                icon: Dumbbell,
            },
            {
                title: 'Last Performed',
                value: data.stats.lastPerformedAt ? format(new Date(data.stats.lastPerformedAt), 'MMM d, yyyy') : 'No history',
                icon: Trophy,
            },
        ]
    }, [data])

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full border border-transparent hover:border-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {data && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleOpenYouTube}
                        >
                            <Youtube className="h-4 w-4 text-red-500" />
                            Watch Form
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                        <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Loading exercise stats...
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                        <CardContent className="py-12 text-center space-y-4">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button size="sm" onClick={() => exerciseId && loadExercise(exerciseId)}>
                                Try again
                            </Button>
                        </CardContent>
                    </Card>
                ) : data ? (
                    <>
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black">
                                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                                        {data.exercise.name}
                                    </span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
                                    {data.exercise.category && (
                                        <span className="px-3 py-1 rounded-full bg-secondary/60 text-foreground/80 uppercase tracking-wide">
                                            {data.exercise.category}
                                        </span>
                                    )}
                                    {data.exercise.equipment && (
                                        <span className="px-3 py-1 rounded-full bg-secondary/40">{data.exercise.equipment}</span>
                                    )}
                                    {data.exercise.primary_muscles.map(muscle => (
                                        <span key={muscle} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                                            {muscle}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">Performance Snapshot</CardTitle>
                                    <CardDescription>Your best efforts and recent progress</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {summaryItems.map(item => (
                                            <div key={item.title} className="relative overflow-hidden rounded-xl border border-border/60 bg-secondary/10 p-4">
                                                <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-primary/10" />
                                                <div className="relative flex items-center gap-3">
                                                    <item.icon className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.title}</p>
                                                        <p className="text-lg font-semibold text-foreground">{item.value}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Peak Set Volume</CardTitle>
                                    <CardDescription>Highest set volume (reps × weight) per training day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PeakVolumeChart data={data.stats.volumeByDate} />
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {bestCards.map(card => {
                                    const formatted = formatBestRecord(card.record)
                                    const isHighlighted = !!card.record && !!data.stats.personalBest && (
                                        card.key === 'pb' || (
                                            data.stats.personalBest.volume === card.record.volume &&
                                            data.stats.personalBest.reps === card.record.reps &&
                                            data.stats.personalBest.weight === card.record.weight
                                        )
                                    )
                                    return (
                                        <div key={card.key} className="relative group">
                                            <div className={cn(
                                                'absolute -inset-0.5 rounded-3xl opacity-0 blur transition duration-300 group-hover:opacity-40',
                                                `bg-gradient-to-r ${card.accent}`
                                            )} />
                                            <Card className="relative bg-card/95 backdrop-blur-sm border-border/50 h-full">
                                                <CardHeader className="px-4 pt-3 pb-1">
                                                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 pt-0">
                                                    {formatted ? (
                                                        <div className="space-y-1.5">
                                                            <div className={`text-lg font-bold ${isHighlighted ? 'text-emerald-500' : 'text-foreground'}`}>
                                                                {formatted.display}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{formatted.volume.toFixed(0)} kg volume</div>
                                                            <div className="text-[11px] text-muted-foreground">{formatted.date}</div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground leading-tight">No sets logged in this window.</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                                })}
                            </div>


                            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Try These Alternatives</CardTitle>
                                    <CardDescription>Target the same muscles with these variations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.alternatives.length > 0 ? (
                                        <div className="space-y-3">
                                            {data.alternatives.map(alt => (
                                                <div key={alt._id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border/60 rounded-xl p-4 hover:border-primary/40 transition">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{alt.name}</p>
                                                        <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                            {alt.equipment && <span>{alt.equipment}</span>}
                                                            <span>{alt.primary_muscles.join(', ')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1"
                                                            onClick={() => router.push(`/exercises/${alt._id}`)}
                                                        >
                                                            View
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No close alternatives found yet.</p>
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
