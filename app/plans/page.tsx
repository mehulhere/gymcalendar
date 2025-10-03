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
        <div className="flex flex-col min-h-screen pb-20">
            <div className="flex-1 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Workout Plans</h1>
                    <Button className="touch-target" onClick={() => router.push('/plans/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Plan
                    </Button>
                </div>

                {isLoading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading plans...
                        </CardContent>
                    </Card>
                ) : plans.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Plans Yet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first workout plan to get started
                            </p>
                            <Button
                                className="w-full touch-target-lg"
                                onClick={() => router.push('/plans/new')}
                            >
                                Create Your First Plan
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <Card key={plan._id} className={plan.isActive ? 'border-emerald-500' : ''}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {plan.name}
                                                {plan.isActive && (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                )}
                                            </CardTitle>
                                            <CardDescription>
                                                {plan.days.length} day{plan.days.length !== 1 ? 's' : ''} •{' '}
                                                {plan.days.reduce((sum, day) => sum + day.exercises.length, 0)} exercises
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {plan.days.map((day) => (
                                            <div
                                                key={day._id}
                                                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                                            >
                                                {day.name}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {!plan.isActive && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => activatePlan(plan._id)}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Activate
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/plans/${plan._id}`)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deletePlan(plan._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}


