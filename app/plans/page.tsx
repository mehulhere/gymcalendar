'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Play, Edit, Trash2, CheckCircle2 } from 'lucide-react'

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
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/plans', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setPlans(data.plans || [])
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error)
        } finally {
            setIsLoading(false)
        }
    }

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
                    <div className="relative">
                        <div className="absolute -inset-1 gradient-emerald rounded-3xl opacity-5 blur-2xl" />
                        <Card className="relative bg-card/95 backdrop-blur-sm border-border/50">
                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-2xl">No Plans Yet</CardTitle>
                                <CardDescription>Start building your fitness journey today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center mb-6">
                                    Create your first workout plan to get started on your fitness goals 💪
                                </p>
                                <div className="relative">
                                    <div className="absolute -inset-1 gradient-emerald rounded-2xl opacity-30 blur-xl" />
                                    <Button
                                        className="relative w-full touch-target-lg gradient-emerald text-white border-0 hover:opacity-90 transition-opacity"
                                        onClick={() => router.push('/plans/new')}
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Create Your First Plan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
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

            <BottomNav />
        </div>
    )
}


