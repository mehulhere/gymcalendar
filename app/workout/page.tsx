'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useToast } from '@/components/ui/use-toast'
import { Play, Check, Youtube, Shuffle, ChevronLeft, Sparkles } from 'lucide-react'
import { WorkoutMascot } from '@/components/workout/workout-mascot'
import { openYouTubeExercise } from '@/lib/youtube'

interface ExerciseRef { _id: string; name: string }
interface Plan {
    _id: string
    name: string
    isActive?: boolean
    days: Array<{
        _id: string
        name: string
        exercises: Array<{
            exerciseId: ExerciseRef
            sets: number
            defaultReps: number
            targetWeight?: number
            alternates?: ExerciseRef[]
        }>
    }>
}

export default function WorkoutPage() {
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const { toast } = useToast()
    const [plans, setPlans] = useState<Plan[]>([])
    const [selectedPlan, setSelectedPlan] = useState<string>('')
    const [selectedDay, setSelectedDay] = useState<string>('')
    const [activeSession, setActiveSession] = useState<any>(null)
    const [sessionData, setSessionData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const LOCAL_STORAGE_KEY = 'activeWorkoutSession'

    const fetchPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/plans', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setPlans(data.plans || [])
                // Auto-select active plan
                const activePlan = data.plans.find((p: Plan) => p.isActive)
                if (activePlan) {
                    setSelectedPlan(activePlan._id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error)
        }
    }, [accessToken])
    useEffect(() => {
        // Load session from local storage on component mount
        if (typeof window !== 'undefined') {
            const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (savedSession) {
                try {
                    const parsedSession = JSON.parse(savedSession)
                    setActiveSession(parsedSession.activeSession)
                    setSessionData(parsedSession.sessionData)
                    setSelectedPlan(parsedSession.activeSession.planId)
                    setSelectedDay(parsedSession.activeSession.planDayId)
                } catch (error) {
                    console.error('Failed to parse saved session from local storage', error)
                    localStorage.removeItem(LOCAL_STORAGE_KEY)
                }
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (activeSession && sessionData) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ activeSession, sessionData }))
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY)
            }
        }
    }, [activeSession, sessionData])

    useEffect(() => {
        if (!accessToken) return
        fetchPlans()
    }, [accessToken, fetchPlans])

    const startWorkout = async () => {
        if (!selectedPlan || !selectedDay) {
            toast({
                title: 'Error',
                description: 'Please select a plan and day',
                variant: 'destructive',
            })
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/sessions/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: selectedPlan,
                    planDayId: selectedDay,
                    date: new Date().toISOString(),
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setActiveSession(data.session)
                setSessionData(data.session.exercises)
                toast({
                    title: 'Workout started!',
                    description: 'Good luck with your session',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to start workout',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
        const newData = [...sessionData]
        if (!newData[exerciseIndex].sets[setIndex]) {
            newData[exerciseIndex].sets[setIndex] = { reps: 0, weight: 0 }
        }
        // Convert empty string to 0, otherwise parse as float
        const numericValue = value === '' ? 0 : parseFloat(value) || 0
        newData[exerciseIndex].sets[setIndex][field] = numericValue
        setSessionData(newData)
    }

    const finishWorkout = async () => {
        try {
            // First, save the current progress
            const currentToken = useAuthStore.getState().accessToken
            const formattedExercises = sessionData.map((ex: any) => ({
                exerciseId: typeof ex.exerciseId === 'string' ? ex.exerciseId : ex.exerciseId._id,
                sets: ex.sets.map((set: any) => ({
                    reps: parseFloat(set.reps) || 0,
                    weight: parseFloat(set.weight) || 0,
                    rpe: set.rpe,
                })),
                notes: ex.notes || '',
            }))

            const saveResponse = await fetch(`/api/sessions/${activeSession._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ exercises: formattedExercises }),
            })

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json()
                throw new Error(errorData.error || 'Failed to save progress before finishing')
            }

            // Then, finish the workout
            const response = await fetch(`/api/sessions/${activeSession._id}/finish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ checkIn: true }),
            })

            if (response.ok) {
                toast({
                    title: 'Workout completed!',
                    description: 'Great job! 🎉',
                })
                setActiveSession(null)
                setSessionData(null)
                router.push('/')
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to finish workout',
                variant: 'destructive',
            })
        }
    }

    const exitActiveWorkout = () => {
        setActiveSession(null)
        setSessionData(null)
    }

    // Ask backend to switch to next alternate; if none or pressed repeatedly, backend auto-finds by muscles
    const switchToAlternate = async (exerciseIndex: number) => {
        try {
            if (!activeSession) return
            const res = await fetch(`/api/sessions/${activeSession._id}/alternate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ exerciseIndex }),
            })
            if (!res.ok) {
                const msg = await res.json().catch(() => ({}))
                toast({ title: 'Alternate error', description: msg.error || 'Unable to switch exercise', variant: 'destructive' })
                return
            }
            const data = await res.json()
            const updated = data.exercise
            const newData = [...sessionData]
            newData[exerciseIndex] = { ...newData[exerciseIndex], exerciseId: updated.exerciseId }
            setSessionData(newData)
            toast({ title: 'Alternate loaded', description: `Now: ${updated.exerciseId?.name || 'Exercise'}` })
        } catch (e) {
            console.error('Alternate switch failed', e)
            toast({ title: 'Error', description: 'Failed to load alternate', variant: 'destructive' })
        }
    }

    const selectedPlanData = plans.find(p => p._id === selectedPlan)

    if (activeSession && sessionData) {
        return (
            <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
                <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4 animate-scale-in">
                    {/* Header - Sticky */}
                    <div className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-xl z-10 py-3 px-4 -mx-4 rounded-2xl border border-border/50 shadow-lg">
                        <h1 className="text-2xl md:text-3xl font-black">
                            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                                Active Workout
                            </span>
                        </h1>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={exitActiveWorkout}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    {/* Exercise Cards */}
                    {sessionData.map((exercise: any, exIndex: number) => {
                        const completedSets = exercise.sets.filter((s: any) => s.reps > 0 && s.weight > 0).length
                        const isComplete = completedSets === exercise.sets.length
                        const progress = (completedSets / exercise.sets.length) * 100

                        return (
                            <div key={exIndex} className="relative group">
                                {isComplete && (
                                    <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-20 blur-lg" />
                                )}
                                <Card className={`relative bg-card/95 backdrop-blur-sm border-border/50 transition-all duration-300 ${isComplete ? 'border-emerald-500/50' : ''
                                    }`}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
                                                    {exercise.exerciseId?.name || 'Exercise'}
                                                    {isComplete && (
                                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                                                            <Check className="h-4 w-4" />
                                                            Done
                                                        </div>
                                                    )}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openYouTubeExercise(exercise.exerciseId?.name || '')}
                                                    className="hover:bg-red-500/10 text-red-500"
                                                >
                                                    <Youtube className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => switchToAlternate(exIndex)}
                                                    className="ml-1 hover:bg-blue-500/10 text-blue-500"
                                                >
                                                    <Shuffle className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-1 w-full">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {completedSets} / {exercise.sets.length} sets
                                                </span>
                                                <span className="font-semibold text-emerald-600">
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                                                <div
                                                    className="h-full gradient-emerald transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {exercise.sets.map((set: any, setIndex: number) => {
                                            const setComplete = set.reps > 0 && set.weight > 0
                                            return (
                                                <div
                                                    key={setIndex}
                                                    className={`grid grid-cols-[auto_1fr_1fr] gap-3 items-center p-2 rounded-xl transition-all ${setComplete ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-card/95'
                                                        }`}
                                                >
                                                    <Label className="text-sm font-semibold min-w-[4rem]">
                                                        Set {setIndex + 1}
                                                    </Label>
                                                    <div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Reps"
                                                            value={set.reps === 0 ? '' : set.reps}
                                                            onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                                                            className="h-10 bg-background/50 border-border/50"
                                                            min="0"
                                                            step="1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Weight"
                                                            value={set.weight === 0 ? '' : set.weight}
                                                            onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                                                            className="h-10 bg-background/50 border-border/50"
                                                            min="0"
                                                            step="0.5"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}

                    {/* Finish Button */}
                    <div className="relative">
                        <div className="absolute -inset-1 gradient-emerald rounded-2xl opacity-30 blur-xl" />
                        <Button
                            className="relative w-full touch-target-lg gradient-emerald text-white border-0 hover:opacity-90 transition-all duration-300 shadow-lg"
                            size="lg"
                            onClick={finishWorkout}
                        >
                            <Check className="h-5 w-5 mr-2" />
                            Finish Workout & Check In
                        </Button>
                    </div>
                </div>
                <BottomNav />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                                Start Workout
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-card/90 backdrop-blur-sm p-6 md:p-10 shadow-[0_18px_50px_rgba(16,185,129,0.15)]">
                    <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-emerald-500/12 blur-3xl" />
                    <div className="absolute -bottom-36 -right-16 h-72 w-72 rounded-full bg-emerald-700/10 blur-3xl" />
                    <div className="relative flex flex-col lg:flex-row items-center gap-8">
                        <div className="space-y-3 text-center lg:text-left max-w-lg">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                <Sparkles className="h-4 w-4" />
                                Today&apos;s session awaits
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Start Workout</h1>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Plan, Lock in and get, set, go.
                                </p>
                            </div>
                            <div className="flex justify-center lg:justify-start">
                                <WorkoutMascot />
                            </div>

                        </div>
                        <div className="w-full max-w-md bg-background/70 border border-border/40 rounded-2xl p-6 shadow-lg backdrop-blur-sm space-y-3">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">Workout Plan</Label>
                                {selectedPlanData ? (
                                    <div className="w-full p-3 border border-border/50 rounded-xl bg-background/80 font-medium flex items-center justify-between">
                                        <span>{selectedPlanData.name}</span>
                                        <span className="text-emerald-500">✓ Active</span>
                                    </div>
                                ) : (
                                    <div className="w-full p-3 border border-border/50 rounded-xl bg-background/80 font-medium text-muted-foreground">
                                        No active plan
                                    </div>
                                )}
                            </div>

                            {selectedPlanData && (
                                <div className="space-y-3 animate-scale-in">
                                    <Label className="text-sm font-semibold text-foreground">Workout Day</Label>
                                    <select
                                        className="w-full p-3 border border-border/50 rounded-xl bg-background/80 touch-target font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                    >
                                        <option value="">Choose a day...</option>
                                        {selectedPlanData.days.map(day => (
                                            <option key={day._id} value={day._id}>
                                                {day.name} • {day.exercises.length} exercises
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {plans.length === 0 && (
                                <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                    Build a plan first to unlock workouts.&apos; &apos;
                                    <button
                                        type="button"
                                        className="underline decoration-emerald-400/80 hover:decoration-emerald-300 transition"
                                        onClick={() => router.push('/plans/new')}
                                    >
                                        Create a plan
                                    </button>
                                </div>
                            )}

                            <div className="relative pt-2">
                                <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-xl opacity-60" />
                                <Button
                                    className="relative w-full touch-target-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 hover:from-emerald-500/95 hover:to-emerald-600/95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={startWorkout}
                                    disabled={!selectedPlan || !selectedDay || isLoading}
                                >
                                    <Play className="h-5 w-5 mr-2" />
                                    {isLoading ? 'Starting...' : 'Start Workout'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
