'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'

interface Exercise {
    _id: string
    name: string
    equipment: string
    primary_muscles: string[]
    category: string
}

interface ExerciseSearchProps {
    onSelectExercise: (exercise: Exercise) => void
    dropdownPlacement?: 'top' | 'bottom'
}

export function ExerciseSearch({ onSelectExercise, dropdownPlacement = 'bottom' }: ExerciseSearchProps) {
    const { accessToken } = useAuthStore()
    const [query, setQuery] = useState('')
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const dropdownPositionClass = dropdownPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

    useEffect(() => {
        if (query.length > 0) {
            searchExercises()
        } else {
            setExercises([])
        }
    }, [query])

    const searchExercises = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/exercises/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setExercises(data.exercises || [])
                setIsOpen(true)
            }
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelect = (exercise: Exercise) => {
        onSelectExercise(exercise)
        setQuery('')
        setExercises([])
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search exercises (e.g., bench press, squat...)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query && setIsOpen(true)}
                        className="pl-10 touch-target"
                    />
                </div>
            </div>

            {isOpen && exercises.length > 0 && (
                <div className={`absolute z-50 w-full ${dropdownPositionClass} bg-card border rounded-lg shadow-lg max-h-80 overflow-y-auto`}>
                    {exercises.map((exercise) => (
                        <button
                            key={exercise._id}
                            onClick={() => handleSelect(exercise)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0 touch-target"
                        >
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {exercise.equipment} • {exercise.primary_muscles.join(', ')}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query && exercises.length === 0 && !isLoading && (
                <div className={`absolute z-50 w-full ${dropdownPositionClass} bg-card border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground`}>
                    No exercises found. Try a different search term.
                </div>
            )}

            {isLoading && (
                <div className={`absolute z-50 w-full ${dropdownPositionClass} bg-card border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground`}>
                    Searching...
                </div>
            )}
        </div>
    )
}
