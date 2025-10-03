'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'

interface SessionData {
    date: string
    exerciseName: string
    volume: number
    sets: number
}

export default function MuscleStatsPage() {
    const params = useParams()
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const [muscleName, setMuscleName] = useState<string>('')
    const [sessions, setSessions] = useState<SessionData[]>([])
    const [totalVolume, setTotalVolume] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (params.muscle) {
            const muscle = decodeURIComponent(params.muscle as string)
            setMuscleName(muscle)
            fetchMuscleStats(muscle)
        }
    }, [params.muscle, accessToken])

    const fetchMuscleStats = async (muscle: string) => {
        setIsLoading(true)
        try {
            // Fetch sessions for last 30 days
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 30)

            const response = await fetch(
                `/api/sessions?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                }
            )

            if (response.ok) {
                const data = await response.json()
                calculateMuscleVolume(data.sessions || [], muscle)
            }
        } catch (error) {
            console.error('Failed to fetch muscle stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateMuscleVolume = (sessions: any[], targetMuscle: string) => {
        const muscleSessionData: SessionData[] = []
        let total = 0

        sessions.forEach(session => {
            if (session.status === 'completed') {
                session.exercises?.forEach((exercise: any) => {
                    const primaryMuscles = exercise.exerciseId?.primary_muscles || []

                    // Check if this exercise targets the muscle (case-insensitive)
                    const targetsMuscle = primaryMuscles.some((m: string) =>
                        m.toLowerCase() === targetMuscle.toLowerCase()
                    )

                    if (targetsMuscle) {
                        let exerciseVolume = 0
                        const validSets = exercise.sets?.filter((s: any) => s.reps > 0 && s.weight > 0) || []

                        validSets.forEach((set: any) => {
                            exerciseVolume += set.reps * set.weight
                        })

                        if (exerciseVolume > 0) {
                            muscleSessionData.push({
                                date: session.date,
                                exerciseName: exercise.exerciseId?.name || 'Unknown',
                                volume: exerciseVolume,
                                sets: validSets.length,
                            })
                            total += exerciseVolume
                        }
                    }
                })
            }
        })

        setSessions(muscleSessionData.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ))
        setTotalVolume(total)
    }

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <div className="flex-1 p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold capitalize">{muscleName} Stats</h1>
                        <p className="text-sm text-muted-foreground">Last 30 days</p>
                    </div>
                </div>

                {isLoading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading stats...
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Total Volume Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Volume</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">{totalVolume.toLocaleString()}</span>
                                    <span className="text-lg text-muted-foreground">kg</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Across {sessions.length} workout{sessions.length !== 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Session History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Workout History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {sessions.map((session, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{session.exerciseName}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {format(new Date(session.date), 'MMM d, yyyy')} • {session.sets} sets
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">{session.volume.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">kg</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No {muscleName} workouts in the last 30 days.</p>
                                        <p className="text-sm mt-2">Start training to see your stats!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    )
}