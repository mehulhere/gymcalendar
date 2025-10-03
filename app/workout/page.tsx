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
import { Play, Check, Youtube, Save } from 'lucide-react'
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

    useEffect(() => {
        fetchPlans()
    }, [])

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

    const saveProgress = async () => {
        try {
            // Get current token
            const currentToken = useAuthStore.getState().accessToken

            // Transform sessionData to match API schema - exerciseId must be string
            const formattedExercises = sessionData.map((ex: any) => ({
                exerciseId: typeof ex.exerciseId === 'string' ? ex.exerciseId : ex.exerciseId._id,
                sets: ex.sets.map((set: any) => ({
                    reps: parseFloat(set.reps) || 0,
                    weight: parseFloat(set.weight) || 0,
                    rpe: set.rpe,
                })),
                notes: ex.notes || '',
            }))

            const response = await fetch(`/api/sessions/${activeSession._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ exercises: formattedExercises }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save')
            }

            toast({ title: 'Progress saved!' })
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' })
        }
    }

    const finishWorkout = async () => {
        try {
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
            <div className="flex flex-col min-h-screen pb-20">
                <div className="flex-1 p-4 space-y-4">
                    <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
                        <h1 className="text-2xl font-bold">Active Workout</h1>
                        <Button variant="outline" size="sm" onClick={saveProgress}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    </div>

                    {sessionData.map((exercise: any, exIndex: number) => {
                        const completedSets = exercise.sets.filter((s: any) => s.reps > 0 && s.weight > 0).length
                        const isComplete = completedSets === exercise.sets.length

                        return (
                            <Card key={exIndex} className={isComplete ? 'border-emerald-500' : ''}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            {exercise.exerciseId?.name || 'Exercise'}
                                            {isComplete && <Check className="inline ml-2 h-5 w-5 text-emerald-500" />}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openYouTubeExercise(exercise.exerciseId?.name || '')}
                                        >
                                            <Youtube className="h-5 w-5 text-red-500" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {completedSets} / {exercise.sets.length} sets
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {exercise.sets.map((set: any, setIndex: number) => (
                                        <div key={setIndex} className="grid grid-cols-3 gap-2 items-center">
                                            <Label className="text-sm">Set {setIndex + 1}</Label>
                                            <div>
                                                <Input
                                                    type="number"
                                                    placeholder="Reps"
                                                    value={set.reps === 0 ? '' : set.reps}
                                                    onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                                                    className="h-10"
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
                                                    className="h-10"
                                                    min="0"
                                                    step="0.5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )
                    })}

                    <Button
                        className="w-full touch-target-lg"
                        size="lg"
                        onClick={finishWorkout}
                    >
                        <Check className="h-5 w-5 mr-2" />
                        Finish Workout & Check In
                    </Button>
                </div>
                <BottomNav />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <div className="flex-1 p-4 space-y-4">
                <h1 className="text-2xl font-bold">Start Workout</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Select Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Workout Plan</Label>
                            <select
                                className="w-full p-2 border rounded-md bg-background touch-target"
                                value={selectedPlan}
                                onChange={(e) => {
                                    setSelectedPlan(e.target.value)
                                    setSelectedDay('')
                                }}
                            >
                                <option value="">Choose a plan...</option>
                                {plans.map(plan => (
                                    <option key={plan._id} value={plan._id}>
                                        {plan.name} {plan.isActive && '(Active)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedPlanData && (
                            <div className="space-y-2">
                                <Label>Day</Label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background touch-target"
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                >
                                    <option value="">Choose a day...</option>
                                    {selectedPlanData.days.map(day => (
                                        <option key={day._id} value={day._id}>
                                            {day.name} ({day.exercises.length} exercises)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Button
                            className="w-full touch-target-lg"
                            onClick={startWorkout}
                            disabled={!selectedPlan || !selectedDay || isLoading}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {isLoading ? 'Starting...' : 'Start Workout'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <BottomNav />
        </div>
    )
}


