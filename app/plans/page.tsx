'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Play, Edit, Trash2, CheckCircle2, Sparkles, Dumbbell } from 'lucide-react'
import { readCache, writeCache } from '@/lib/utils/cache'

interface Plan {
    _id: string
    name: string
    isActive: boolean
    days: Array<{
        _id: string
        name: string
        exercises: any[]
    }>
}

export default function PlansPage() {
    const router = useRouter()
    const { accessToken } = useAuthStore()
    const { toast } = useToast()
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const cachedPlans = readCache<Plan[]>('plans:list')
        if (cachedPlans) {
            setPlans(cachedPlans.value)
            setIsLoading(false)
        }
    }, [])

    const fetchPlans = useCallback(async () => {
        try {
            const response = await fetch('/api/plans', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setPlans(data.plans || [])
                writeCache('plans:list', data.plans || [])
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error)
        } finally {
            setIsLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        if (!accessToken) return
        fetchPlans()
    }, [accessToken, fetchPlans])

    const activatePlan = async (planId: string) => {
        try {
            const response = await fetch(`/api/plans/${planId}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                toast({
                    title: 'Plan activated',
                    description: 'This plan is now your active workout plan',
                })
                fetchPlans()
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to activate plan',
                variant: 'destructive',
            })
        }
    }

    const deletePlan = async (planId: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return

        try {
            const response = await fetch(`/api/plans/${planId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                toast({
                    title: 'Plan deleted',
                    description: 'The workout plan has been removed',
                })
                fetchPlans()
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete plan',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                                Workout Plans
                            </span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your training programs
                        </p>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-1 gradient-emerald rounded-xl opacity-30 blur" />
                        <Button
                            className="relative gradient-emerald text-white border-0 hover:opacity-90 transition-opacity touch-target"
                            onClick={() => router.push('/plans/new')}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Plan
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="relative">
                        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p>Loading plans...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-card/90 backdrop-blur-sm p-8 md:p-10 shadow-[0_18px_50px_rgba(16,185,129,0.15)]">
                        <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-emerald-500/12 blur-3xl" />
                        <div className="absolute -bottom-36 -left-20 h-72 w-72 rounded-full bg-emerald-700/10 blur-3xl" />
                        <div className="relative flex flex-col items-center gap-6 text-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                <Sparkles className="h-4 w-4" />
                                You&apos;re a plan away
                            </span>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-foreground">Make Your First Plan</h2>
                                <p className="text-sm text-muted-foreground">
                                    A few taps today keeps your training dialed in all week.
                                </p>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-36 w-36 rounded-full bg-emerald-500/10 blur-xl" />
                                <div className="absolute h-44 w-44 rounded-full border border-emerald-500/20 animate-pulse" />
                                <div className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/20 via-transparent to-emerald-700/20 border border-emerald-500/30 shadow-inner shadow-emerald-900/20">
                                    <Dumbbell
                                        className="h-12 w-12 text-emerald-300 animate-spin"
                                        style={{ animationDuration: '6s' }}
                                    />
                                </div>
                            </div>

                            <Button
                                className="mt-2 w-full max-w-xs touch-target-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/25 hover:from-emerald-500/95 hover:to-emerald-600/95"
                                onClick={() => router.push('/plans/new')}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Your First Plan
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <div key={plan._id} className="relative group">
                                {plan.isActive && (
                                    <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-20 blur-lg" />
                                )}
                                <Card className={`relative bg-card/95 backdrop-blur-sm transition-all duration-300 ${plan.isActive ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-border/50 hover:border-border'
                                    }`}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                                    {plan.name}
                                                    {plan.isActive && (
                                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-xs font-semibold">Active</span>
                                                        </div>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {plan.days.length} {plan.days.length === 1 ? 'day' : 'days'} •{' '}
                                                    {plan.days.reduce((sum, day) => sum + day.exercises.length, 0)} exercises
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Days */}
                                        <div className="flex flex-wrap gap-2">
                                            {plan.days.map((day) => (
                                                <div
                                                    key={day._id}
                                                    className="px-3 py-1.5 bg-muted/50 backdrop-blur-sm text-foreground rounded-lg text-xs font-medium border border-border/50"
                                                >
                                                    {day.name}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {!plan.isActive && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                                                    onClick={() => activatePlan(plan._id)}
                                                >
                                                    <Play className="h-4 w-4 mr-1.5" />
                                                    Activate
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => router.push(`/plans/${plan._id}`)}
                                            >
                                                <Edit className="h-4 w-4 mr-1.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-500 hover:bg-red-500/10 border-red-500/50"
                                                onClick={() => deletePlan(plan._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-muted-foreground/70 pt-10">
                <Dumbbell className="h-14 w-14 -rotate-12 text-muted-foreground/60" />
                <p className="text-xs uppercase tracking-[0.5em] font-semibold">Keep stacking wins</p>
            </div>

            <BottomNav />
        </div>
    )
}
