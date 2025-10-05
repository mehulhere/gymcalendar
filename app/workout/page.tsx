'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useToast } from '@/components/ui/use-toast'
import { Play, Check, Youtube, Shuffle } from 'lucide-react'
import { openYouTubeExercise } from '@/lib/youtube'

interface Plan {
    _id: string
    name: string
    isActive?: boolean
    days: Array<{
        _id: string
        name: string
        exercises: Array<{
            exerciseId: { _id: string; name: string }
            sets: number
            defaultReps: number
            targetWeight?: number
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

    useEffect(() => {
        fetchPlans()
        // Load session from local storage on component mount
        const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedSession) {
            try {
                const parsedSession = JSON.parse(savedSession)
                // Validate if the session is still active (e.g., from today or recent)
                // For simplicity, we'll just load it. More robust validation could be added.
                setActiveSession(parsedSession.activeSession)
                setSessionData(parsedSession.sessionData)
                setSelectedPlan(parsedSession.activeSession.planId)
                setSelectedDay(parsedSession.activeSession.planDayId)
            } catch (error) {
                console.error("Failed to parse saved session from local storage", error)
                localStorage.removeItem(LOCAL_STORAGE_KEY) // Clear invalid data
            }
        }
    }, [])

    useEffect(() => {
        if (activeSession && sessionData) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ activeSession, sessionData }))
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
    }, [activeSession, sessionData])

    const fetchPlans = async () => {
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
    }

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
                                        <div className="flex items-center justify-between">
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
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">
                                                            {completedSets} / {exercise.sets.length} sets
                                                        </span>
                                                        <span className="font-semibold text-emerald-600">
                                                            {progress.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full gradient-emerald transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openYouTubeExercise(exercise.exerciseId?.name || '')}
                                                className="ml-2 hover:bg-red-500/10 text-red-500"
                                            >
                                                <Youtube className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { /* Implement shuffle logic later */ }}
                                                className="ml-1 hover:bg-blue-500/10 text-blue-500"
                                            >
                                                <Shuffle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {exercise.sets.map((set: any, setIndex: number) => {
                                            const setComplete = set.reps > 0 && set.weight > 0
                                            return (
                                                <div
                                                    key={setIndex}
                                                    className={`grid grid-cols-[auto_1fr_1fr] gap-3 items-center p-3 rounded-xl transition-all ${setComplete ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-muted/30'
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
            <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6 animate-scale-in">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                            Start Workout
                        </span>
                    </h1>
                    <p className="text-muted-foreground">
                        Choose your plan and let's get started! 🔥
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-5 blur-2xl" />
                    <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Select Plan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-foreground">Workout Plan</Label>
                                <select
                                    className="w-full p-3 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm touch-target font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    value={selectedPlan}
                                    onChange={(e) => {
                                        setSelectedPlan(e.target.value)
                                        setSelectedDay('')
                                    }}
                                >
                                    <option value="">Choose a plan...</option>
                                    {plans.map(plan => (
                                        <option key={plan._id} value={plan._id}>
                                            {plan.name} {plan.isActive && '✓ Active'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedPlanData && (
                                <div className="space-y-3 animate-scale-in">
                                    <Label className="text-sm font-semibold text-foreground">Workout Day</Label>
                                    <select
                                        className="w-full p-3 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm touch-target font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

                            <div className="relative pt-2">
                                <div className="absolute -inset-1 gradient-emerald rounded-2xl opacity-30 blur-xl" />
                                <Button
                                    className="relative w-full touch-target-lg gradient-emerald text-white border-0 hover:opacity-90 transition-all duration-300 shadow-lg disabled:opacity-50"
                                    onClick={startWorkout}
                                    disabled={!selectedPlan || !selectedDay || isLoading}
                                >
                                    <Play className="h-5 w-5 mr-2" />
                                    {isLoading ? 'Starting...' : 'Start Workout'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}


