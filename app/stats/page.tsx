'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MuscleHeatmap } from '@/components/stats/muscle-heatmap'
import { WeightChart } from '@/components/stats/weight-chart'
import { Target, Dumbbell } from 'lucide-react'

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
    const { accessToken } = useAuthStore()
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

        setVolumeData({
            totalVolume,
            weeklyVolume: totalVolume,
            muscleVolumes,
            muscleSets,
            workoutCount,
            streak: 0, // Would calculate from attendance
        })
    }, [])

    const fetchUserSettings = useCallback(async () => {
        try {
            const response = await fetch('/api/user/settings', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setUserSettings(data.settings)
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
            }
        } catch (error) {
            console.error('Failed to fetch weigh-ins:', error)
        }
    }, [accessToken])

    useEffect(() => {
        fetchStats()
        fetchWeighIns()
        fetchUserSettings()
    }, [fetchStats, fetchWeighIns, fetchUserSettings])

    const formatVolume = (volume: number) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`
        }
        return volume.toFixed(0)
    }

    const topMuscles = Object.entries(volumeData.muscleVolumes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

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
