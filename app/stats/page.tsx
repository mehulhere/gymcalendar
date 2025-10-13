'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MuscleHeatmap } from '@/components/stats/muscle-heatmap'
import { WeightChart } from '@/components/stats/weight-chart'
import { Input } from '@/components/ui/input'
import { Target, Dumbbell, Search, Loader2, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { ExerciseSummary } from '@/lib/stats/exercise-performance'
import type { ProgressSummaryItem } from '@/lib/stats/progress'
import { readCache, writeCache } from '@/lib/utils/cache'

interface VolumeData {
    totalVolume: number
    weeklyVolume: number
    muscleVolumes: Record<string, number>
    muscleSets: Record<string, number>
    workoutCount: number
    streak: number
}

interface WeighIn {
    _id: string
    weight: number
    date: string
}

export default function StatsPage() {
    const accessToken = useAuthStore((state) => state.accessToken)
    const hasAttemptedRestore = useAuthStore((state) => state.hasAttemptedRestore)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const hasHydrated = useAuthStore((state) => state.hasHydrated)
    const isRestoring = useAuthStore((state) => state.isRestoring)
    const router = useRouter()
    const [volumeData, setVolumeData] = useState<VolumeData>({
        totalVolume: 0,
        weeklyVolume: 0,
        muscleVolumes: {},
        muscleSets: {},
        workoutCount: 0,
        streak: 0,
    })
    const [weighIns, setWeighIns] = useState<WeighIn[]>([])
    const [userSettings, setUserSettings] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [exerciseSummaries, setExerciseSummaries] = useState<ExerciseSummary[]>([])
    const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(true)
    const [exerciseError, setExerciseError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [progressOverview, setProgressOverview] = useState<{ weekly: ProgressSummaryItem, monthly: ProgressSummaryItem } | null>(null)
    const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(true)
    const [progressError, setProgressError] = useState<string | null>(null)

    useEffect(() => {
        const cachedVolume = readCache<VolumeData>('stats:volumeData')
        if (cachedVolume) {
            setVolumeData(cachedVolume.value)
            setIsLoading(false)
        }

        const cachedWeighIns = readCache<WeighIn[]>('user:weighIns')
        if (cachedWeighIns) {
            setWeighIns(cachedWeighIns.value)
        }

        const cachedSettings = readCache<any>('user:settings')
        if (cachedSettings) {
            setUserSettings(cachedSettings.value)
        }

        const cachedExercises = readCache<ExerciseSummary[]>('stats:exerciseSummaries')
        if (cachedExercises) {
            setExerciseSummaries(cachedExercises.value)
            setIsLoadingExercises(false)
        }

        const cachedProgress = readCache<{ weekly: ProgressSummaryItem, monthly: ProgressSummaryItem }>('stats:progressOverview')
        if (cachedProgress) {
            setProgressOverview(cachedProgress.value)
            setIsLoadingProgress(false)
        }
    }, [])

    useEffect(() => {
        if (!hasAttemptedRestore) {
            return
        }

        if (!accessToken || !isAuthenticated) {
            setIsLoading(false)
            setIsLoadingExercises(false)
            setIsLoadingProgress(false)
        }
    }, [accessToken, hasAttemptedRestore, isAuthenticated])

    const calculateVolumes = useCallback((sessions: any[]) => {
        let totalVolume = 0
        const muscleVolumes: Record<string, number> = {}
        const muscleSets: Record<string, number> = {}
        let workoutCount = 0

        sessions.forEach(session => {
            // Only count completed sessions
            if (session.status === 'completed') {
                workoutCount++
            }

            session.exercises?.forEach((exercise: any) => {
                const primaryMuscles = exercise.exerciseId?.primary_muscles || []

                exercise.sets?.forEach((set: any) => {
                    // Check for valid reps and weight (> 0)
                    if (set.reps > 0 && set.weight > 0) {
                        const volume = set.reps * set.weight
                        totalVolume += volume

                        // Add to muscle volumes (using original case from database)
                        primaryMuscles.forEach((muscleName: string) => {
                            // Store with the exact case from database
                            muscleVolumes[muscleName] = (muscleVolumes[muscleName] || 0) + volume
                            muscleSets[muscleName] = (muscleSets[muscleName] || 0) + 1
                        })
                    }
                })
            })
        })

        console.log('Calculated volume:', { totalVolume, muscleVolumes, muscleSets, workoutCount, sessions })

        const calculatedVolume: VolumeData = {
            totalVolume,
            weeklyVolume: totalVolume,
            muscleVolumes,
            muscleSets,
            workoutCount,
            streak: 0, // Would calculate from attendance
        }

        setVolumeData(calculatedVolume)
        writeCache('stats:volumeData', calculatedVolume)
    }, [])

    const fetchUserSettings = useCallback(async () => {
        try {
            const response = await fetch('/api/user/settings', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setUserSettings(data.settings)
                writeCache('user:settings', data.settings)
            }
        } catch (error) {
            console.error('Failed to fetch user settings:', error)
        }
    }, [accessToken])

    const fetchStats = useCallback(async () => {
        try {
            // Fetch sessions for last 7 days
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 7)

            const response = await fetch(
                `/api/sessions?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                }
            )

            if (response.ok) {
                const data = await response.json()
                calculateVolumes(data.sessions || [])
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }, [accessToken, calculateVolumes])

    const fetchWeighIns = useCallback(async () => {
        try {
            const response = await fetch('/api/weighins', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setWeighIns(data.weighIns || [])
                writeCache('user:weighIns', data.weighIns || [])
            }
        } catch (error) {
            console.error('Failed to fetch weigh-ins:', error)
        }
    }, [accessToken])

    const fetchExerciseSummaries = useCallback(async () => {
        setIsLoadingExercises(true)
        setExerciseError(null)
        try {
            const response = await fetch('/api/stats/exercises', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })

            if (response.ok) {
                const data = await response.json()
                setExerciseSummaries(data.exercises || [])
                writeCache('stats:exerciseSummaries', data.exercises || [])
            } else {
                const errorData = await response.json().catch(() => null)
                setExerciseError(errorData?.error || 'Unable to load exercises')
            }
        } catch (error) {
            console.error('Failed to fetch exercise summaries:', error)
            setExerciseError('Unable to load exercises')
        } finally {
            setIsLoadingExercises(false)
        }
    }, [accessToken])

    const fetchProgressOverview = useCallback(async () => {
        setIsLoadingProgress(true)
        setProgressError(null)
        try {
            const response = await fetch('/api/stats/progress/overview', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })

            if (response.ok) {
                const data = await response.json()
                setProgressOverview(data)
                writeCache('stats:progressOverview', data)
            } else {
                const errorData = await response.json().catch(() => null)
                setProgressError(errorData?.error || 'Unable to load progress overview')
            }
        } catch (error) {
            console.error('Failed to fetch progress overview:', error)
            setProgressError('Unable to load progress overview')
        } finally {
            setIsLoadingProgress(false)
        }
    }, [accessToken])

    useEffect(() => {
        if (!accessToken) return
        fetchStats()
        fetchWeighIns()
        fetchUserSettings()
        fetchExerciseSummaries()
        fetchProgressOverview()
    }, [accessToken, fetchStats, fetchWeighIns, fetchUserSettings, fetchExerciseSummaries, fetchProgressOverview])

    const filteredExercises = useMemo(() => {
        if (exerciseSummaries.length === 0) return []
        const query = searchQuery.trim().toLowerCase()
        const limit = query.length === 0 ? 5 : 10

        if (query.length === 0) {
            return exerciseSummaries.slice(0, limit)
        }

        return exerciseSummaries
            .filter(summary => {
                const nameMatch = summary.name.toLowerCase().includes(query)
                const primaryMatch = summary.primaryMuscles.some(muscle => muscle.toLowerCase().includes(query))
                const secondaryMatch = summary.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(query))
                return nameMatch || primaryMatch || secondaryMatch
            })
            .slice(0, limit)
    }, [exerciseSummaries, searchQuery])

    const formatWeight = (weight: number) => {
        return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1)
    }

    const formatPersonalBest = (record: ExerciseSummary['personalBest']) => {
        if (!record) {
            return '—'
        }
        return `${formatWeight(record.weight)} kg × ${record.reps} reps`
    }

    const formatLastPerformed = (date: string | null) => {
        if (!date) return 'Never performed'
        return `Last on ${format(new Date(date), 'MMM d, yyyy')}`
    }

    const formatVolume = (volume: number) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`
        }
        return volume.toFixed(0)
    }

    const topMuscles = Object.entries(volumeData.muscleVolumes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

    const formatPercent = (value: number) => {
        if (!Number.isFinite(value)) return '0%'
        const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1)
        return `${rounded}%`
    }

    const getTrendStyles = (value: number) => {
        if (value > 0) {
            return {
                text: 'text-emerald-500',
                badge: 'bg-emerald-500/10 text-emerald-500',
                label: 'Up from previous',
            }
        }
        if (value < 0) {
            return {
                text: 'text-red-500',
                badge: 'bg-red-500/10 text-red-500',
                label: 'Down from previous',
            }
        }
        return {
            text: 'text-muted-foreground',
            badge: 'bg-muted text-muted-foreground',
            label: 'No change',
        }
    }

    if (isRestoring) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading your stats...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 text-muted-foreground">
                <p className="text-sm font-medium">Sign in to see your stats.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 animate-scale-in">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent">
                        Your Stats
                    </span>
                </h1>


                {/* Summary Cards - Enhanced */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {/* Target Weight Card */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 gradient-purple rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-300" />
                        <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Target Weight
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {userSettings?.targetWeight ? (
                                    <>
                                        <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                                            {userSettings.targetWeight} kg
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {userSettings.targetDays} days goal
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        No target set
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Weekly Volume Card */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 gradient-emerald rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-300" />
                        <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4" />
                                    Weekly Volume
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                                    {formatVolume(volumeData.weeklyVolume)} kg
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This week&apos;s total
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Weight Progress Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weight Progress</CardTitle>
                        <CardDescription>Track your body weight over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WeightChart
                            weighIns={weighIns}
                            targetWeight={userSettings?.targetWeight}
                        />
                    </CardContent>
                </Card>
                {/* Muscle Heatmap - Enhanced */}
                <div className="relative">
                    <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-5 blur-2xl" />
                    <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl md:text-2xl font-bold">Muscle Volume Distribution</CardTitle>
                            <CardDescription>Weekly training volume by muscle group</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MuscleHeatmap muscleVolumes={volumeData.muscleVolumes} muscleSets={volumeData.muscleSets} />
                        </CardContent>
                    </Card>
                </div>

                {/* Top Trained Muscles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Trained Muscles</CardTitle>
                        <CardDescription>This week&apos;s focus areas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topMuscles.length > 0 ? (
                            topMuscles.map(([muscle, volume]) => {
                                const maxVolume = Math.max(...Object.values(volumeData.muscleVolumes))
                                const percentage = (volume / maxVolume) * 100

                                return (
                                    <div key={muscle} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium capitalize">{muscle}</span>
                                            <span className="text-muted-foreground">
                                                {formatVolume(volume)} kg
                                            </span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No workout data yet. Start training to see your stats!
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Exercise Personal Best Search */}
                <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl font-bold">Exercise Personal Bests</CardTitle>
                        <CardDescription>Search any exercise you have logged to jump into detailed stats</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search your exercises (e.g., bench press, squat)"
                                className="pl-10"
                            />
                        </div>

                        {exerciseError && (
                            <div className="text-sm text-destructive">{exerciseError}</div>
                        )}

                        {isLoadingExercises ? (
                            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Loading your exercise history...
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredExercises.length > 0 ? (
                                    filteredExercises.map(exercise => (
                                        <button
                                            key={exercise.exerciseId}
                                            onClick={() => router.push(`/exercises/${exercise.exerciseId}`)}
                                            className="w-full text-left p-4 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-base md:text-lg">{exercise.name}</p>
                                                        <div className="inline-flex items-center gap-2 text-xs font-medium">
                                                            <span className={exercise.personalBest ? 'text-primary' : 'text-muted-foreground'}>PB</span>
                                                            <span className="text-foreground">{formatPersonalBest(exercise.personalBest)}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                                        {exercise.primaryMuscles.join(', ')}
                                                    </p>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-3">
                                                <span>{formatLastPerformed(exercise.lastPerformedAt)}</span>
                                                <span>•</span>
                                                <span>{exercise.totalSessions} session{exercise.totalSessions === 1 ? '' : 's'}</span>
                                                <span>•</span>
                                                <span>{exercise.totalSets} set{exercise.totalSets === 1 ? '' : 's'}</span>
                                                {exercise.personalBest?.date && (
                                                    <span>
                                                        • PB logged {format(new Date(exercise.personalBest.date), 'MMM d, yyyy')}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-6">
                                        {exerciseSummaries.length === 0
                                            ? 'No exercises logged yet. Complete a workout to build your history.'
                                            : 'No exercises matched your search. Try a different name or muscle group.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weekly & Monthly Progress */}
                <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl md:text-2xl font-bold">Weekly & Monthly Progress</CardTitle>
                        <CardDescription>Track how your volume trends against the previous period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {progressError && (
                            <div className="text-sm text-destructive">{progressError}</div>
                        )}

                        {isLoadingProgress ? (
                            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Calculating progress...
                            </div>
                        ) : !progressOverview ? (
                            <div className="text-sm text-muted-foreground text-center py-6">
                                Unable to calculate progress yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(['weekly', 'monthly'] as const).map(period => {
                                    const data = progressOverview[period]
                                    const trend = getTrendStyles(data.percentChange)
                                    const percent = formatPercent(data.percentChange)
                                    const targetRoute = `/stats/progress/${period}`
                                    const title = period === 'weekly' ? 'Weekly Progress' : 'Monthly Progress'
                                    return (
                                        <button
                                            key={period}
                                            onClick={() => router.push(targetRoute)}
                                            className="w-full text-left px-4 py-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">{title}</p>
                                                    <span className={`inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full ${trend.badge}`}>
                                                        <span className="font-semibold">{percent}</span>
                                                        <span>{trend.label}</span>
                                                    </span>
                                                    <div className="text-xs text-muted-foreground">
                                                        Current: {formatVolume(data.currentVolume)} kg • Previous: {formatVolume(data.previousVolume)} kg
                                                    </div>
                                                </div>
                                                <ArrowUpRight className={`h-4 w-4 ${trend.text}`} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>




                {/* Weekly Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Progress</CardTitle>
                        <CardDescription>Last 7 days overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm">Sessions Completed</span>
                                </div>
                                <span className="font-bold">{volumeData.workoutCount} / 7</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-purple-500" />
                                    <span className="text-sm">On Track</span>
                                </div>
                                <span className="font-bold">
                                    {volumeData.workoutCount >= 3 ? '✅ Yes' : '❌ Need More'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <BottomNav />
        </div>
    )
}
