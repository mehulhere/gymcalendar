'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ExerciseSearch } from '@/components/plans/exercise-search'
import { Plus, Trash2, GripVertical, ChevronLeft } from 'lucide-react'

interface Exercise {
    exerciseId: string
    exerciseName: string
    sets: number
    alternates?: string[] // Array of alternate exercise IDs
}

interface PlanDay {
    name: string
    weekday?: string
    exercises: Exercise[]
}

export default function NewPlanPage() {
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const { toast } = useToast()

    const [planName, setPlanName] = useState('')
    const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
    const [weekdayMode, setWeekdayMode] = useState(false)
    const [days, setDays] = useState<PlanDay[]>([
        { name: 'Day 1', exercises: [] }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [swipedExercise, setSwipedExercise] = useState<string | null>(null)
    const [showAlternateSearch, setShowAlternateSearch] = useState<{ dayIndex: number, exerciseIndex: number } | null>(null)
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)

    const addDay = () => {
        setDays([...days, { name: `Day ${days.length + 1}`, exercises: [] }])
    }

    const removeDay = (dayIndex: number) => {
        setDays(days.filter((_, i) => i !== dayIndex))
    }

    const updateDayName = (dayIndex: number, name: string) => {
        const newDays = [...days]
        newDays[dayIndex].name = name
        setDays(newDays)
    }

    const updateDayWeekday = (dayIndex: number, weekday: string) => {
        const newDays = [...days]
        newDays[dayIndex].weekday = weekday
        setDays(newDays)
    }

    const addExercise = (dayIndex: number, exercise: any) => {
        const newDays = [...days]
        newDays[dayIndex].exercises.push({
            exerciseId: exercise._id,
            exerciseName: exercise.name,
            sets: 3,
        })
        setDays(newDays)
    }

    const removeExercise = (dayIndex: number, exerciseIndex: number) => {
        const newDays = [...days]
        newDays[dayIndex].exercises.splice(exerciseIndex, 1)
        setDays(newDays)
    }

    const updateExercise = (dayIndex: number, exerciseIndex: number, field: string, value: number) => {
        const newDays = [...days]
        newDays[dayIndex].exercises[exerciseIndex][field as keyof Exercise] = value as never
        setDays(newDays)
    }

    const addAlternate = (dayIndex: number, exerciseIndex: number, alternateExercise: any) => {
        const newDays = [...days]
        const exercise = newDays[dayIndex].exercises[exerciseIndex]
        if (!exercise.alternates) {
            exercise.alternates = []
        }
        exercise.alternates.push(alternateExercise._id)
        setDays(newDays)
        setShowAlternateSearch(null)
        setSwipedExercise(null)
    }

    const removeAlternate = (dayIndex: number, exerciseIndex: number, alternateId: string) => {
        const newDays = [...days]
        const exercise = newDays[dayIndex].exercises[exerciseIndex]
        if (exercise.alternates) {
            exercise.alternates = exercise.alternates.filter(id => id !== alternateId)
        }
        setDays(newDays)
    }

    const handleTouchStart = (e: React.TouchEvent, exerciseKey: string) => {
        const touch = e.touches[0]
        setTouchStart({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchMove = (e: React.TouchEvent, exerciseKey: string) => {
        if (!touchStart) return

        const touch = e.touches[0]
        const deltaX = touch.clientX - touchStart.x
        const deltaY = Math.abs(touch.clientY - touchStart.y)

        // Only trigger swipe if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > 50 && deltaY < 100) {
            if (deltaX < -30) {
                setSwipedExercise(exerciseKey)
            } else if (deltaX > 30) {
                setSwipedExercise(null)
            }
        }
    }

    const handleTouchEnd = () => {
        setTouchStart(null)
    }

    const handleSubmit = async () => {
        if (!planName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a plan name',
                variant: 'destructive',
            })
            return
        }

        if (days.length === 0 || days.every(d => d.exercises.length === 0)) {
            toast({
                title: 'Error',
                description: 'Please add at least one exercise',
                variant: 'destructive',
            })
            return
        }

        // Validate weekday mode
        if (weekdayMode) {
            const hasUnassigned = days.some(d => !d.weekday)
            if (hasUnassigned) {
                toast({
                    title: 'Error',
                    description: 'Please assign a weekday to each day',
                    variant: 'destructive',
                })
                return
            }
        }

        setIsSubmitting(true)

        try {
            // Build weekdayMap if in weekday mode
            const weekdayMap: Record<string, string> = {}
            if (weekdayMode) {
                days.forEach(day => {
                    if (day.weekday) {
                        weekdayMap[day.weekday] = day.name
                    }
                })
            }

            const response = await fetch('/api/plans', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: planName,
                    sessionsPerWeek,
                    schedule: {
                        mode: weekdayMode ? 'weekday' : 'sequence',
                        weekdayMap: weekdayMode ? weekdayMap : undefined,
                    },
                    days: days.map(day => ({
                        name: day.name,
                        exercises: day.exercises.map(ex => ({
                            exerciseId: ex.exerciseId,
                            sets: ex.sets,
                            alternates: ex.alternates || [],
                        })),
                    })),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create plan')
            }

            toast({
                title: 'Success!',
                description: 'Your workout plan has been created',
            })

            router.push('/plans')
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create plan',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen p-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Create Workout Plan</h1>
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="planName">Plan Name</Label>
                            <Input
                                id="planName"
                                placeholder="e.g., Push Pull Legs Plan"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                className="touch-target"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sessionsPerWeek">Sessions Per Week</Label>
                            <Input
                                id="sessionsPerWeek"
                                type="number"
                                min="1"
                                max="7"
                                value={sessionsPerWeek}
                                onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 1)}
                                className="touch-target"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <Label htmlFor="weekdayMode" className="cursor-pointer">
                                    Weekday Mode
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Assign specific weekdays to each workout day
                                </p>
                            </div>
                            <button
                                id="weekdayMode"
                                type="button"
                                role="switch"
                                aria-checked={weekdayMode}
                                onClick={() => setWeekdayMode(!weekdayMode)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${weekdayMode ? 'bg-emerald-500' : 'bg-gray-300'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${weekdayMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {days.map((day, dayIndex) => (
                    <Card key={dayIndex}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={day.name}
                                        onChange={(e) => updateDayName(dayIndex, e.target.value)}
                                        className="font-semibold"
                                        placeholder="Day name (e.g., Push Day)"
                                    />
                                    {weekdayMode && (
                                        <select
                                            value={day.weekday || ''}
                                            onChange={(e) => updateDayWeekday(dayIndex, e.target.value)}
                                            className="w-full p-2 border rounded-md bg-background text-sm"
                                        >
                                            <option value="">Select weekday...</option>
                                            <option value="mon">Monday</option>
                                            <option value="tue">Tuesday</option>
                                            <option value="wed">Wednesday</option>
                                            <option value="thu">Thursday</option>
                                            <option value="fri">Friday</option>
                                            <option value="sat">Saturday</option>
                                            <option value="sun">Sunday</option>
                                        </select>
                                    )}
                                </div>
                                {days.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDay(dayIndex)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {day.exercises.map((exercise, exIndex) => {
                                const exerciseKey = `${dayIndex}-${exIndex}`
                                const isSwiped = swipedExercise === exerciseKey

                                return (
                                    <div key={exIndex} className="relative overflow-hidden">
                                        {/* Swipeable Exercise Card */}
                                        <div
                                            className={`flex gap-2 items-center p-4 border rounded-lg bg-card transition-transform duration-300 ${isSwiped ? '-translate-x-20' : 'translate-x-0'
                                                }`}
                                            onTouchStart={(e) => handleTouchStart(e, exerciseKey)}
                                            onTouchMove={(e) => handleTouchMove(e, exerciseKey)}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="font-medium">{exercise.exerciseName}</p>
                                                {exercise.alternates && exercise.alternates.length > 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        {exercise.alternates.length} alternate{exercise.alternates.length !== 1 ? 's' : ''}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Swipe left to add alternates</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={exercise.sets}
                                                        onChange={(e) =>
                                                            updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value))
                                                        }
                                                        className="h-9 text-center"
                                                        placeholder="Sets"
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">sets</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeExercise(dayIndex, exIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Hidden Alternate Actions */}
                                        <div className={`absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center transition-transform duration-300 ${isSwiped ? 'translate-x-0' : 'translate-x-full'
                                            }`}>
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    className="h-12 w-12 rounded-full bg-emerald-700 hover:bg-emerald-800 shadow-lg"
                                                    onClick={() => setShowAlternateSearch({ dayIndex, exerciseIndex: exIndex })}
                                                >
                                                    <Plus className="h-6 w-6 text-white" />
                                                </Button>
                                                <span className="text-xs text-white font-medium">Add</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            <ExerciseSearch onSelectExercise={(ex) => addExercise(dayIndex, ex)} />
                        </CardContent>
                    </Card>
                ))}

                <Button
                    variant="outline"
                    className="w-full touch-target-lg"
                    onClick={addDay}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Day
                </Button>

                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 touch-target-lg"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 touch-target-lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Plan'}
                    </Button>
                </div>
            </div>

            {/* Alternate Exercise Search Modal */}
            {showAlternateSearch && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50">
                    <div className="bg-background w-full max-h-[80vh] rounded-t-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add Alternate Exercise</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowAlternateSearch(null)}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </div>
                        <ExerciseSearch
                            dropdownPlacement="top"
                            onSelectExercise={(ex) => addAlternate(showAlternateSearch.dayIndex, showAlternateSearch.exerciseIndex, ex)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
