'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from 'next-themes'
import { Weight, Target, LogOut, Save, Edit2, X, Check, Sun, Moon, Monitor } from 'lucide-react'

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
    const { theme, setTheme } = useTheme()
    const [weighIns, setWeighIns] = useState<WeighIn[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [newWeight, setNewWeight] = useState('')
    const [isAddingWeight, setIsAddingWeight] = useState(false)
    const [userSettings, setUserSettings] = useState<any>(null)
    const [isEditingGoal, setIsEditingGoal] = useState(false)
    const [targetWeight, setTargetWeight] = useState('')
    const [targetDays, setTargetDays] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchWeighIns()
        fetchGoals()
        fetchUserSettings()
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

    const fetchUserSettings = async () => {
        try {
            const response = await fetch('/api/user/settings', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            })
            if (response.ok) {
                const data = await response.json()
                setUserSettings(data.settings)
                if (data.settings.targetWeight) {
                    setTargetWeight(data.settings.targetWeight.toString())
                }
                if (data.settings.targetDays) {
                    setTargetDays(data.settings.targetDays.toString())
                }
            }
        } catch (error) {
            console.error('Failed to fetch user settings:', error)
        }
    }

    const updateTargetGoal = async () => {
        const weight = parseFloat(targetWeight)
        const days = parseInt(targetDays)

        if (!weight || weight <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid target weight',
                variant: 'destructive',
            })
            return
        }

        if (!days || days <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter valid number of days',
                variant: 'destructive',
            })
            return
        }

        try {
            const response = await fetch('/api/user/settings', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetWeight: weight,
                    targetDays: days,
                }),
            })

            if (response.ok) {
                toast({ title: 'Target goal updated!' })
                setIsEditingGoal(false)
                fetchUserSettings()
            } else {
                throw new Error('Failed to update')
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update target goal',
                variant: 'destructive',
            })
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
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6 animate-scale-in">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                        Profile
                    </span>
                </h1>

                {/* User Info - Enhanced */}
                <div className="relative">
                    <div className="absolute -inset-1 gradient-purple rounded-3xl opacity-10 blur-2xl" />
                    <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute -inset-1 gradient-emerald rounded-full opacity-30 blur" />
                                    <div className="relative h-16 w-16 rounded-full gradient-emerald flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{user?.name}</CardTitle>
                                    <CardDescription className="text-base">{user?.email}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Current Weight - Enhanced */}
                <div className="relative">
                    <div className="absolute -inset-1 gradient-blue rounded-3xl opacity-10 blur-2xl" />
                    <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Weight className="h-5 w-5" />
                                Current Weight
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {latestWeight ? (
                                <div className="space-y-3">
                                    <div className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                                        {latestWeight.toFixed(1)} kg
                                    </div>
                                    {weightChange !== 0 && (
                                        <div className={`text-sm font-semibold flex items-center gap-1 ${weightChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            <div className={`h-2 w-2 rounded-full ${weightChange > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
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
                                    placeholder="Enter weight (kg)"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className="flex-1 bg-background/50 border-border/50"
                                />
                                <Button
                                    onClick={addWeighIn}
                                    disabled={isAddingWeight}
                                    className="gradient-blue text-white border-0 hover:opacity-90"
                                >
                                    <Save className="h-4 w-4 mr-1.5" />
                                    Log
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Target Weight Goal */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Target Weight Goal
                            </CardTitle>
                            {!isEditingGoal && userSettings?.targetWeight && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingGoal(true)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEditingGoal ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                                    <Input
                                        id="targetWeight"
                                        type="number"
                                        placeholder="90"
                                        value={targetWeight}
                                        onChange={(e) => setTargetWeight(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetDays">Days to Achieve Goal</Label>
                                    <Input
                                        id="targetDays"
                                        type="number"
                                        placeholder="100"
                                        value={targetDays}
                                        onChange={(e) => setTargetDays(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        onClick={updateTargetGoal}
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Save
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditingGoal(false)
                                            // Reset to original values
                                            if (userSettings?.targetWeight) {
                                                setTargetWeight(userSettings.targetWeight.toString())
                                            }
                                            if (userSettings?.targetDays) {
                                                setTargetDays(userSettings.targetDays.toString())
                                            }
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : userSettings?.targetWeight ? (
                            <div className="space-y-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{userSettings.targetWeight} kg</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {userSettings.targetDays} days goal
                                </div>
                                {latestWeight && (
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">
                                                {latestWeight.toFixed(1)} kg / {userSettings.targetWeight} kg
                                            </span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${latestWeight <= userSettings.targetWeight
                                                    ? 'bg-emerald-500'
                                                    : 'bg-red-500'
                                                    }`}
                                                style={{
                                                    width: `${Math.min((latestWeight / userSettings.targetWeight) * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                        <div className="text-sm">
                                            {latestWeight > userSettings.targetWeight ? (
                                                <span className="text-red-500">
                                                    {(latestWeight - userSettings.targetWeight).toFixed(1)} kg to lose
                                                </span>
                                            ) : latestWeight < userSettings.targetWeight ? (
                                                <span className="text-emerald-500">
                                                    {(userSettings.targetWeight - latestWeight).toFixed(1)} kg to gain
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500">🎉 Goal achieved!</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    No target weight set yet
                                </p>
                                <Button onClick={() => setIsEditingGoal(true)}>
                                    <Target className="h-4 w-4 mr-2" />
                                    Set Target Weight
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Theme Settings - Enhanced */}
                <div className="relative">
                    <div className="absolute -inset-1 gradient-orange rounded-3xl opacity-10 blur-2xl" />
                    <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Appearance</CardTitle>
                            <CardDescription>Choose your preferred theme</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mounted && (
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                            ${theme === 'light'
                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                                : 'border-border/50 hover:border-border'
                                            }
                                        `}
                                    >
                                        <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-emerald-600' : ''}`} />
                                        <span className="text-sm font-semibold">Light</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                            ${theme === 'dark'
                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                                : 'border-border/50 hover:border-border'
                                            }
                                        `}
                                    >
                                        <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-emerald-600' : ''}`} />
                                        <span className="text-sm font-semibold">Dark</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                            ${theme === 'system'
                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                                : 'border-border/50 hover:border-border'
                                            }
                                        `}
                                    >
                                        <Monitor className={`h-6 w-6 ${theme === 'system' ? 'text-emerald-600' : ''}`} />
                                        <span className="text-sm font-semibold">System</span>
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Logout Button - Enhanced */}
                <Button
                    variant="destructive"
                    className="w-full touch-target-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 text-white shadow-lg hover:shadow-red-500/30 transition-all"
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
