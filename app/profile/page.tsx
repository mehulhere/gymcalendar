'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Weight, Target, LogOut, Save } from 'lucide-react'

interface WeighIn {
    _id: string
    weight: number
    date: string
}

interface Goal {
    _id: string
    type: string
    target: number
    current: number
    deadline: string
}

export default function ProfilePage() {
    const { user, logout, accessToken } = useAuthStore()
    const router = useRouter()
    const { toast } = useToast()
    const [weighIns, setWeighIns] = useState<WeighIn[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [newWeight, setNewWeight] = useState('')
    const [isAddingWeight, setIsAddingWeight] = useState(false)

    useEffect(() => {
        fetchWeighIns()
        fetchGoals()
    }, [])

    const fetchWeighIns = async () => {
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
    }

    const fetchGoals = async () => {
        try {
            const response = await fetch('/api/goals', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setGoals(data.goals || [])
            }
        } catch (error) {
            console.error('Failed to fetch goals:', error)
        }
    }

    const addWeighIn = async () => {
        const weight = parseFloat(newWeight)
        if (!weight || weight <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid weight',
                variant: 'destructive',
            })
            return
        }

        setIsAddingWeight(true)
        try {
            const response = await fetch('/api/weighins', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    weight,
                    date: new Date().toISOString(),
                }),
            })

            if (response.ok) {
                toast({ title: 'Weight logged!' })
                setNewWeight('')
                fetchWeighIns()
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to log weight',
                variant: 'destructive',
            })
        } finally {
            setIsAddingWeight(false)
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            logout()
            toast({
                title: 'Logged out',
                description: 'You have been logged out successfully',
            })
            router.push('/auth/login')
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to log out',
                variant: 'destructive',
            })
        }
    }

    const latestWeight = weighIns[0]?.weight
    const weightChange = weighIns.length >= 2
        ? weighIns[0].weight - weighIns[1].weight
        : 0

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <div className="flex-1 p-4 space-y-4">
                <h1 className="text-2xl font-bold">Profile</h1>

                {/* User Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <CardTitle>{user?.name}</CardTitle>
                                <CardDescription>{user?.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Current Weight */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Weight className="h-5 w-5" />
                            Current Weight
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {latestWeight ? (
                            <div className="space-y-2">
                                <div className="text-3xl font-bold">
                                    {latestWeight.toFixed(1)} kg
                                </div>
                                {weightChange !== 0 && (
                                    <div className={`text-sm ${weightChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg from last
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No weight entries yet</p>
                        )}

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Weight (kg)"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={addWeighIn}
                                disabled={isAddingWeight}
                            >
                                <Save className="h-4 w-4 mr-1" />
                                Log
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {goals.length > 0 ? (
                            <div className="space-y-3">
                                {goals.map(goal => {
                                    const progress = goal.target > 0
                                        ? (goal.current / goal.target) * 100
                                        : 0

                                    return (
                                        <div key={goal._id} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium capitalize">{goal.type}</span>
                                                <span className="text-muted-foreground">
                                                    {goal.current} / {goal.target}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all"
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No goals set yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Logout Button */}
                <Button
                    variant="destructive"
                    className="w-full touch-target-lg"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>

            <BottomNav />
        </div>
    )
}
